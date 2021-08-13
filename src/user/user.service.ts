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
import { v4 as uuidv4 } from 'uuid';

import { Role } from '../auth/roles/role.enum';
import { Pagination } from '../common/pagination';
import { UserCreationDto } from './dto/user.creation.dto';
import { UserPatchDto } from './dto/user.patch.dto';
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
			username: "admin",
			password: await bcrypt.hash(adminPassword, 10),
			role: Role.Admin,
			email: ""
		});

		try {
			await this.userRepository.save(toSave);
		} catch(error) {
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
	): Promise<{ page: number; perPage: number; total: number; users: UserEntity[] }> {
		const pagination = Pagination.check(page, perPage);
		const total = await this.userRepository.count();
		const result = await this.userRepository.find({
			skip: (pagination.page - 1) * pagination.perPage,
			take: pagination.perPage,
		});
		return { page: pagination.page, perPage: pagination.perPage, total: total, users: result };
	}

	public async getUser(id: string, request?: RequestWithUser): Promise<UserEntity> {
		const dbUser = await this.userRepository.findOneOrFail(id).catch(() => {
			throw new NotFoundException(`User with id ${id} not found`);
		});
		if (request && request.user && request.user.id) {
			const connectedUser = await this.getUser(request.user.id).catch(() => {
				throw new UnauthorizedException('Bad Token');
			});
			if (connectedUser.id == id) {
				const privateUser = classToPlain(dbUser, { groups: ['private'] });
				delete dbUser.password;
				return Object.assign(privateUser, dbUser);
			} else {
				throw new ForbiddenException('Forbidden resource');
			}
		}
		delete dbUser.password;
		return dbUser;
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

	public getUserByUsername(username: string): Promise<UserEntity> {
		return this.userRepository.findOneOrFail({ username: username }).catch(() => {
			throw new NotFoundException(`User with username ${username} not found`);
		});
	}

	public getUserByEmail(email: string): Promise<UserEntity> {
		return this.userRepository.findOneOrFail({ email: email }).catch(() => {
			throw new NotFoundException(`User with email ${email} not found`);
		});
	}

	public async saveUser(newUser: UserCreationDto, request: RequestWithUser): Promise<UserEntity> {
		if (request.user.role != Role.Admin) {
			throw new UnauthorizedException("User is not admin");
		}

		let toSave = Object.assign(new UserEntity(), newUser);
		toSave.password = await bcrypt.hash(toSave.password, 10);

		toSave.role = Role.User;

		if ((await this.userRepository.findOne({ username: newUser.username })) != null) {
			throw new ConflictException(`User with username ${newUser.username} already exists`);
		}

		if ((await this.userRepository.findOne({ email: newUser.email })) != null) {
			throw new ConflictException(`User with email ${newUser.email} already exists`);
		}

		toSave = await this.userRepository.save(toSave);

		return toSave;
	}

	public async patchUser(request: RequestWithUser, id: string, toPatch: UserPatchDto): Promise<UserEntity> {
		const dbUser = await this.userRepository.findOne(id);
		if (!dbUser) {
			throw new NotFoundException(`User with id ${id} not found`);
		}
		if (dbUser.id != request.user.id) {
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

		await this.userRepository.save(updated);

		const privateUser = classToPlain(updated, { groups: ['private'] });
		delete dbUser.password;

		return Object.assign(privateUser, dbUser);
	}

	public async deleteUser(request: RequestWithUser, id: string): Promise<{ deleted: number }> {
		const userToRemove = await this.userRepository.findOne(id);

		if (id != request.user.id) {
			throw new UnauthorizedException();
		}
		if (!userToRemove) {
			throw new NotFoundException(`User with id ${id} not found`);
		}
		await this.userRepository.remove(userToRemove);
		return { deleted: 1 };
	}

	public async userExist(userID: string): Promise<boolean> {
		if (!(await this.userRepository.findOne(userID))) {
			return false;
		}
		return true;
	}
}