import {
	ConflictException,
	Injectable,
	NotFoundException,
	OnApplicationBootstrap,
	UnauthorizedException,
	Logger,
	BadRequestException,
	ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';

import { GoogleService } from '../services/google/google.service';
import { Role } from '../auth/roles/role.enum';
import { Pagination } from '../common/pagination';
import { UserCreationDto } from './dto/user.creation.dto';
import { UserPatchDto } from './dto/user.patch.dto';
import { UserPrivateDto } from './dto/user.private.dto';
import { UserPublicDto } from './dto/user.public.dto';
import { UserEntity } from './user.entity';
import { RequestWithUser } from './user.utils';
import { MailService } from '../services/mail/mail.service';

@Injectable()
export class UserService implements OnApplicationBootstrap {
	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		private readonly googleService: GoogleService,
		private readonly mailService: MailService,
		private jwtService: JwtService,
	) { }

	async onApplicationBootstrap() {
		const adminName = process.env.ADMIN_USERNAME || "admin";
		let adminPassword: string;

		const user = await this.userRepository.findOneBy({ username: adminName })
		if (user != undefined) {
			Logger.log(`Admin already created.`)
			return;
		}

		if (!process.env.ADMIN_PASSWORD) {
			adminPassword = this.makePassword(12);
			Logger.warn("Admin Pass: " + adminPassword);
		} else {
			adminPassword = process.env.ADMIN_PASSWORD
		}

		const toSave = Object.assign(new UserEntity(), {
			username: adminName,
			password: await bcrypt.hash(adminPassword, 10),
			role: Role.Admin,
			email: process.env.ADMIN_EMAIL || "",
			confirmed: true,
		});

		try {
			await this.userRepository.save(toSave);
		} catch (error) {
			Logger.warn(`Cannot create admin: ${error}`)
		}
	}

	private makePassword(length: number) {
		let result = "";
		const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789&é"\'(-è_çà)=';
		const charactersLength = characters.length;
		for (let i = 0; i < length; i++) {
			result += characters.charAt(Math.floor(Math.random() *
				charactersLength));
		}
		return result;
	}

	public async getUsers(
		page: number,
		perPage: number,
	): Promise<{ page: number; perPage: number; total: number; data: UserPublicDto[] }> {
		const pagination = Pagination.check(page, perPage);
		const total = await this.userRepository.count();
		const result = await this.userRepository.find({
			skip: (pagination.page - 1) * pagination.perPage,
			take: pagination.perPage,
		});
		const datas = new Array<UserPublicDto>();
		result.forEach(entity => datas.push(new UserPublicDto(entity)));

		return { page: pagination.page, perPage: pagination.perPage, total: total, data: datas };
	}

	public async getUser(id: string, request?: RequestWithUser): Promise<UserPublicDto | UserPrivateDto> {
		const dbUser = await this.getUserEntityById(id);
		if (request && request.user && request.user.id) {
			const connectedUser = await this.getUser(request.user.id).catch(() => {
				throw new UnauthorizedException('Bad Token');
			});
			if (connectedUser.id == id || connectedUser.role == Role.Admin) {
				return new UserPrivateDto(dbUser);
			}
		}
		return new UserPublicDto(dbUser);
	}

	public async getUserEntityById(id: string): Promise<UserEntity> {
		return this.userRepository.findOneByOrFail({ id: id }).catch(() => {
			throw new NotFoundException(`User with id ${id} not found`);
		});
	}

	public async getUserRole(id: string): Promise<Role> {
		const user: UserEntity = await this.userRepository.findOneByOrFail({ id: id }).catch(() => {
			throw new NotFoundException(`User with id ${id} not found`);
		});

		return user.role;
	}

	public async getUserByUsername(username: string): Promise<UserEntity> {
		return this.userRepository.findOneByOrFail({ username: username }).catch(() => {
			throw new NotFoundException(`User with username ${username} not found`);
		});
	}

	public async getUserByEmail(email: string): Promise<UserEntity> {
		return this.userRepository.findOneByOrFail({ email: email }).catch(() => {
			throw new NotFoundException(`User with email ${email} not found`);
		});
	}

	public async saveUser(newUser: UserCreationDto): Promise<UserPrivateDto> {
		if (await this.googleService.verifyCaptcha(newUser.captcha) == false) {
			throw new BadRequestException("invalid captcha");
		}

		const toSave = Object.assign(new UserEntity(), newUser);
		toSave.password = await bcrypt.hash(toSave.password, 10);

		if ((await this.userRepository.findOneBy({ username: newUser.username })) != null) {
			throw new ConflictException(`User with username ${newUser.username} already exists`);
		}

		if ((await this.userRepository.findOneBy({ email: newUser.email })) != null) {
			throw new ConflictException(`User with email ${newUser.email} already exists`);
		}

		const savedUser = await this.userRepository.save(toSave);

		const token = this.jwtService.sign({
			userID: savedUser.id,
			email: savedUser.email,
		});

		await this.mailService.sendEmailConfirmation(savedUser, token);

		return new UserPrivateDto(savedUser);
	}

	public async patchUser(request: RequestWithUser, id: string, toPatch: UserPatchDto): Promise<UserPrivateDto> {
		const dbUser = await this.getUserEntityById(id);
		if (dbUser.id != request.user.id && request.user.role != Role.Admin) {
			throw new UnauthorizedException('Cannot modify another user`s account');
		}
		if (toPatch.password) {
			toPatch.password = await bcrypt.hash(toPatch.password, 10);
		}

		const updated: UserEntity = Object.assign(dbUser, toPatch);
		updated.updatedAt = new Date().toISOString();

		if (toPatch.username && (await this.userRepository.findOneBy({ username: toPatch.username })) != null) {
			throw new ConflictException(`User with username ${toPatch.username} already exists`);
		}

		if (toPatch.email && (await this.userRepository.findOneBy({ email: toPatch.email })) != null) {
			throw new ConflictException(`User with email ${toPatch.email} already exists`);
		}

		if (request.user.role == Role.Admin && toPatch.role) {
			updated.role = toPatch.role;
		} else {
			updated.role = dbUser.role;
		}

		if (toPatch.email) {
			updated.confirmed = false;
		}

		const patchedUser = await this.userRepository.save(updated);

		if (toPatch.email) {
			await this.sendEmailConfirmation(patchedUser);
		}

		return new UserPrivateDto(patchedUser);
	}

	public async deleteUser(request: RequestWithUser, id: string) {
		const userToRemove = await this.getUserEntityById(id);

		if (id != request.user.id && request.user.role != Role.Admin) {
			throw new UnauthorizedException();
		}
		await this.userRepository.remove(userToRemove);
	}

	public async userExist(userID: string): Promise<boolean> {
		if (!(await this.userRepository.findOneBy({ id: userID }))) {
			return false;
		}
		return true;
	}

	public async confirm(token: string): Promise<UserPublicDto> {
		const decodedToken: string | { [key:string]: any } | null = this.jwtService.decode(token);

		if (decodedToken === undefined || decodedToken === null || typeof(decodedToken) === 'string') {
			throw new BadRequestException("Invalid token");
		}

		const user = await this.getUserEntityById(decodedToken.userID);

		if (user.confirmed) {
			throw new BadRequestException("Email already confirmed");
		}

		if (user.email !== decodedToken.email) {
			throw new BadRequestException("Invalid token");
		}

		user.confirmed = true;

		return new UserPublicDto(await this.userRepository.save(user));
	}

	public async resend(request: RequestWithUser): Promise<UserPublicDto> {
		const user = await this.getUserEntityById(request.user.id);

		try {
			return await this.sendEmailConfirmation(user);
		} catch(e: any) {
			Logger.error(`Mailing service error: ${e.message}`);
			throw new ServiceUnavailableException("Mailing service unavailable");
		}
	}

	private async sendEmailConfirmation(user: UserEntity): Promise<UserPublicDto> {
		const token = this.jwtService.sign({
			userID: user.id,
			email: user.email,
		});

		await this.mailService.sendEmailConfirmation(user, token);
		return new UserPublicDto(user);
	}
}