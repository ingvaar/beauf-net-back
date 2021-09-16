import {
	ConflictException,
	ForbiddenException,
	Injectable,
	NotFoundException,
	OnApplicationBootstrap,
	UnauthorizedException,
	Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { classToPlain } from 'class-transformer';
import { Repository } from 'typeorm';

import { Role } from '../auth/roles/role.enum';
import { Pagination } from '../common/pagination';
import { UserCreationDto } from './dto/user.creation.dto';
import { UserPatchDto } from './dto/user.patch.dto';
import { UserPrivateDto } from './dto/user.private.dto';
import { UserPublicDto } from './dto/user.public.dto';
import { UserEntity } from './user.entity';
import { RequestWithUser } from './user.utils';

@Injectable()
export class UserService implements OnApplicationBootstrap {
	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
	) { }

	async onApplicationBootstrap() {
		const adminName = process.env.ADMIN_USERNAME || "admin";
		let adminPassword: string;

		const user = await this.userRepository.findOne({ username: adminName })
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

		let toSave = Object.assign(new UserEntity(), {
			username: adminName,
			password: await bcrypt.hash(adminPassword, 10),
			role: Role.Admin,
			email: ""
		});

		try {
			await this.userRepository.save(toSave);
		} catch (error) {
			Logger.warn(`Cannot create admin: ${error}`)
		}
	}

	private makePassword(length: number) {
		let result: string = "";
		const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789&é\"\'(-è_çà)=';
		const charactersLength = characters.length;
		for (var i = 0; i < length; i++) {
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
		const dbUser = await this.userRepository.findOneOrFail(id).catch(() => {
			throw new NotFoundException(`User with id ${id} not found`);
		});
		if (request && request.user && request.user.id) {
			const connectedUser = await this.getUser(request.user.id).catch(() => {
				throw new UnauthorizedException('Bad Token');
			});
			if (connectedUser.id == id) {
				return new UserPrivateDto(dbUser);
			}
		}
		return new UserPublicDto(dbUser);
	}

	public async getUserEntityById(id: string): Promise<UserEntity> {
		return this.userRepository.findOneOrFail(id).catch(() => {
			throw new NotFoundException(`User with id ${id} not found`);
		});
	}

	public async getUserRole(id: string): Promise<Role> {
		const user: UserEntity = await this.userRepository.findOneOrFail(id).catch(() => {
			throw new NotFoundException(`User with id ${id} not found`);
		});

		return user.role;
	}

	public async getUserByUsername(username: string): Promise<UserEntity> {
		return await this.userRepository.findOneOrFail({ username: username }).catch(() => {
			throw new NotFoundException(`User with username ${username} not found`);
		});
	}

	public async getUserByEmail(email: string): Promise<UserEntity> {
		return await this.userRepository.findOneOrFail({ email: email }).catch(() => {
			throw new NotFoundException(`User with email ${email} not found`);
		});
	}

	public async saveUser(newUser: UserCreationDto, request: RequestWithUser): Promise<UserPrivateDto> {
		if (request.user.role != Role.Admin) {
			throw new UnauthorizedException("User is not admin");
		}

		let toSave = Object.assign(new UserEntity(), newUser);
		toSave.password = await bcrypt.hash(toSave.password, 10);

		if ((await this.userRepository.findOne({ username: newUser.username })) != null) {
			throw new ConflictException(`User with username ${newUser.username} already exists`);
		}

		if ((await this.userRepository.findOne({ email: newUser.email })) != null) {
			throw new ConflictException(`User with email ${newUser.email} already exists`);
		}

		return new UserPrivateDto(await this.userRepository.save(toSave));
	}

	public async patchUser(request: RequestWithUser, id: string, toPatch: UserPatchDto): Promise<UserPrivateDto> {
		const dbUser = await this.userRepository.findOne(id);
		if (!dbUser) {
			throw new NotFoundException(`User with id ${id} not found`);
		}
		if (dbUser.id != request.user.id && request.user.role != Role.Admin) {
			throw new UnauthorizedException('Cannot modify another user`s account');
		}
		if (toPatch.password) {
			toPatch.password = await bcrypt.hash(toPatch.password, 10);
		}

		const updated: UserEntity = Object.assign(dbUser, toPatch);
		updated.updatedAt = new Date().toISOString();

		if (toPatch.username && (await this.userRepository.findOne({ username: toPatch.username })) != null) {
			throw new ConflictException(`User with username ${toPatch.username} already exists`);
		}

		if (toPatch.email && (await this.userRepository.findOne({ email: toPatch.email })) != null) {
			throw new ConflictException(`User with email ${toPatch.email} already exists`);
		}

		if (request.user.role == Role.Admin && toPatch.role) {
			updated.role = toPatch.role;
		} else {
			updated.role = dbUser.role;
		}

		return new UserPrivateDto(await this.userRepository.save(updated));
	}

	public async deleteUser(request: RequestWithUser, id: string) {
		const userToRemove = await this.userRepository.findOne(id);

		if (id != request.user.id && request.user.role != Role.Admin) {
			throw new UnauthorizedException();
		}
		if (!userToRemove) {
			throw new NotFoundException(`User with id ${id} not found`);
		}
		await this.userRepository.remove(userToRemove);
	}

	public async userExist(userID: string): Promise<boolean> {
		if (!(await this.userRepository.findOne(userID))) {
			return false;
		}
		return true;
	}
}