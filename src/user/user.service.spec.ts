import {
	ConflictException,
	ForbiddenException,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { request } from 'express';
import { Repository } from 'typeorm';

import { Role } from '../auth/roles/role.enum';
import { UserCreationDto } from './dto/user.creation.dto';
import { UserPatchDto } from './dto/user.patch.dto';
import { UserEntity } from './user.entity';
import { UserService } from './user.service';
import { RequestWithUser } from './user.utils';

describe('User Service', () => {
	let userService: UserService;
	let userRepository: Repository<UserEntity>;

	const user1 = Object.assign(new UserEntity(), {
		username: 'username1',
		id: '1',
		role: Role.Admin,
		password: 'password',
	});
	const user2 = Object.assign(new UserEntity(), {
		username: 'username2',
		id: '2',
		role: Role.User,
		password: 'password',
	});

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [
				UserService,
				{
					provide: getRepositoryToken(UserEntity),
					useValue: {
						find: jest.fn(),
						findOne: jest.fn(),
						findOneOrFail: jest.fn(),
						count: jest.fn(),
						save: jest.fn(),
						remove: jest.fn(),
					},
				},
			],
		}).compile();

		userService = module.get(UserService);
		userRepository = module.get(getRepositoryToken(UserEntity));
	});

	it('should be defined', () => {
		expect(userService).toBeDefined();
		expect(userRepository).toBeDefined();
	});

	describe('get users', () => {
		it('should get users', async function () {
			jest.spyOn(userRepository, 'find').mockResolvedValue([user1, user2]);
			jest.spyOn(userRepository, 'count').mockResolvedValue(2);
			const result = await userService.getUsers(1, 50);

			expect(result).toStrictEqual({ page: 1, perPage: 50, total: 2, users: [user1, user2] });
		});
	});

	describe('get user', () => {
		it('should get private user if the ids match', async function () {
			const mockRequest = {
				user: {
					id: '1',
					role: Role.User,
				},
			} as RequestWithUser;
			jest.spyOn(userRepository, 'findOneOrFail').mockResolvedValue(user1);

			const result = await userService.getUser('1', mockRequest);

			expect(result).toHaveProperty('updatedAt');
			expect(result).not.toHaveProperty('password');
		});

		it('should throw a NotFoundException if no user is found', async function () {
			jest.spyOn(userRepository, 'findOneOrFail').mockRejectedValue(new Error('Not found error'));

			try {
				await userService.getUser('1');
				expect(true).toBe(false);
			} catch (error) {
				expect(error).toBeInstanceOf(NotFoundException);
			}
		});

		it("should throw a UnauthorizedException if the userId from the token's payload does not correspond to an existing user", async function () {
			const mockRequest = {
				user: {
					id: '3',
					role: Role.User,
				},
			} as RequestWithUser;
			jest.spyOn(userRepository, 'findOneOrFail').mockResolvedValueOnce(user1);
			jest.spyOn(userRepository, 'findOneOrFail').mockRejectedValueOnce(new Error('Not found error'));

			try {
				await userService.getUser('1', mockRequest);
				expect(true).toBe(false);
			} catch (error) {
				expect(error).toBeInstanceOf(UnauthorizedException);
			}
		});

		it("should throw a ForbidenException if the userId from the token's payload does not correspond to the passed id and the role is not admin", async function () {
			const mockRequest = {
				user: {
					id: '1',
					role: Role.User,
				},
			} as RequestWithUser;
			jest.spyOn(userRepository, 'findOneOrFail').mockResolvedValueOnce(user1);
			jest.spyOn(userRepository, 'findOneOrFail').mockResolvedValueOnce(user2);

			try {
				await userService.getUser('1', mockRequest);
				expect(true).toBe(false);
			} catch (error) {
				expect(error).toBeInstanceOf(ForbiddenException);
			}
		});
	});

	describe('get user role', () => {
		it('should get the user roles', async function () {
			jest.spyOn(userRepository, 'findOneOrFail').mockResolvedValueOnce(user1);

			const result = await userService.getUserRole('1');

			expect(result).toBe(user1.role);
		});

		it('should throw if the user is not found', async function () {
			jest.spyOn(userRepository, 'findOneOrFail').mockRejectedValue(new Error('Not found error'));

			try {
				await userService.getUserRole('1');
			} catch (error) {
				expect(error).toBeInstanceOf(NotFoundException);
			}
		});
	});

	describe('get user by username', () => {
		it('should get a user by his username', async function () {
			jest.spyOn(userRepository, 'findOneOrFail').mockResolvedValueOnce(user1);

			const result = await userService.getUserByUsername('1');

			expect(result).toBe(user1);
		});

		it('should throw if the user is not found', async function () {
			jest.spyOn(userRepository, 'findOneOrFail').mockRejectedValue(new Error('Not found error'));

			try {
				await userService.getUserByUsername('1');
			} catch (error) {
				expect(error).toBeInstanceOf(NotFoundException);
			}
		});
	});

	describe('get user by email', () => {
		it('should get a user by his email', async function () {
			jest.spyOn(userRepository, 'findOneOrFail').mockResolvedValueOnce(user1);

			const result = await userService.getUserByEmail('1');

			expect(result).toBe(user1);
		});

		it('should throw if the user is not found', async function () {
			jest.spyOn(userRepository, 'findOneOrFail').mockRejectedValue(new Error('Not found error'));

			try {
				await userService.getUserByEmail('1');
			} catch (error) {
				expect(error).toBeInstanceOf(NotFoundException);
			}
		});
	});

	describe('get user entity by id', () => {
		it('should get a user by his email', async function () {
			jest.spyOn(userRepository, 'findOneOrFail').mockResolvedValueOnce(user1);

			const result = await userService.getUserEntityById('1');

			expect(result).toBe(user1);
		});

		it('should throw if the user is not found', async function () {
			jest.spyOn(userRepository, 'findOneOrFail').mockRejectedValue(new Error('Not found error'));

			try {
				await userService.getUserEntityById('1');
			} catch (error) {
				expect(error).toBeInstanceOf(NotFoundException);
			}
		});
	});

	describe('onApplicationBootstrap', () => {
		it('should do nothing if admin already exists', async function () {
			jest.spyOn(userRepository, 'save').mockResolvedValueOnce(user1);
			process.env = Object.assign(process.env, { ADMIN_USERNAME: user1.username });

			const result = await userService.onApplicationBootstrap();

			expect(result).toBeUndefined();
		});
	});

	describe('save user', () => {
		it('should be able to save a user with user role', async function () {
			jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(undefined);
			jest.spyOn(userRepository, 'save').mockResolvedValueOnce(user1);

			const mockRequest = {
				user: {
					id: '1',
					role: Role.Admin,
				},
			} as RequestWithUser

			const newUser = {
				username: 'username',
				password: 'password',
				email: 'test@provider.com',
				role: Role.User,
			} as UserCreationDto;

			const result = await userService.saveUser(newUser, mockRequest);

			expect(result).toBeDefined();
		});

		it('should be able to save a user with admin role', async function () {
			jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(undefined);
			jest.spyOn(userRepository, 'save').mockResolvedValueOnce(user1);

			const mockRequest = {
				user: {
					id: '1',
					role: Role.Admin,
				},
			} as RequestWithUser

			const newUser = {
				username: 'username',
				password: 'password',
				email: 'test@provider.com',
				role: Role.Admin,
			} as UserCreationDto;

			const result = await userService.saveUser(newUser, mockRequest);

			expect(result).toBeDefined();
		});

		it('should throw if a user with the same username already exist', async function () {
			jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(user1);

			const mockRequest = {
				user: {
					id: '1',
					role: Role.Admin,
				},
			} as RequestWithUser

			const newUser = {
				username: 'username',
				password: 'password',
				email: 'test@provider.com',
				role: Role.User,
			} as UserCreationDto;

			try {
				await userService.saveUser(newUser, mockRequest);
			} catch (error) {
				expect(error).toBeInstanceOf(ConflictException);
			}
		});

		it('should throw if a user with the same email already exist', async function () {
			jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(undefined);
			jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(user1);

			const mockRequest = {
				user: {
					id: '1',
					role: Role.Admin,
				},
			} as RequestWithUser

			const newUser = {
				username: 'username',
				password: 'password',
				email: 'test@provider.com',
				role: Role.User,
			} as UserCreationDto;

			try {
				await userService.saveUser(newUser, mockRequest);
			} catch (error) {
				expect(error).toBeInstanceOf(ConflictException);
			}
		});
	});

	it('should throw if user while trying to save a new user without being admin', async function () {
		jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(undefined);
		jest.spyOn(userRepository, 'save').mockResolvedValueOnce(user1);

		const mockRequest = {
			user: {
				id: '1',
				role: Role.User,
			},
		} as RequestWithUser

		const newUser = {
			username: 'username',
			password: 'password',
			email: 'test@provider.com',
		} as UserCreationDto;

		try {
			await userService.saveUser(newUser, mockRequest);
		} catch (error) {
			expect(error).toBeInstanceOf(UnauthorizedException);
		}
	});

	describe('patch user', () => {
		it('should throw a NotFoundException if no user with id is found', async function () {
			jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(undefined);

			const mockRequest = {
				user: {
					id: '1',
					role: Role.User,
				},
			} as RequestWithUser;

			const updatedUser = {
				username: 'username',
				password: 'password',
				role: Role.User,
			} as UserPatchDto;

			try {
				await userService.patchUser(mockRequest, '1', updatedUser);
			} catch (error) {
				expect(error).toBeInstanceOf(NotFoundException);
			}
		});

		it('should throw an UnauthorizedException if the logged in user is different', async function () {
			jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(user2);
			jest.spyOn(userRepository, 'findOneOrFail').mockResolvedValueOnce(user1);

			const mockRequest = {
				user: {
					id: '1',
					role: Role.User,
				},
			} as RequestWithUser;

			const updatedUser = {
				username: 'username',
				password: 'password',
				role: Role.User,
			} as UserPatchDto;

			try {
				await userService.patchUser(mockRequest, '2', updatedUser);
			} catch (error) {
				expect(error).toBeInstanceOf(UnauthorizedException);
			}
		});

		it('should be able to hash the password', async function () {
			jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(user1);
			jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(undefined);

			const mockRequest = {
				user: {
					id: '1',
					role: Role.User,
				},
			} as RequestWithUser;

			const updatedUser = {
				username: 'username',
				password: 'password',
				role: Role.User,
			} as UserPatchDto;

			const result = await userService.patchUser(mockRequest, '1', updatedUser);

			expect(result).toBeDefined();
		});

		it('should throw a ConflictException if the new username is not unique', async function () {
			jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(user1);
			jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(user1);

			const mockRequest = {
				user: {
					id: '1',
					role: Role.User,
				},
			} as RequestWithUser;

			const updatedUser = {
				username: 'username',
				password: 'password',
				role: Role.User,
			} as UserPatchDto;

			try {
				await userService.patchUser(mockRequest, '1', updatedUser);
			} catch (error) {
				expect(error).toBeInstanceOf(ConflictException);
			}
		});

		it('should throw a ConflictException if the new email is not unique', async function () {
			jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(user1);
			jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(undefined);
			jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(user1);

			const mockRequest = {
				user: {
					id: '1',
					role: Role.User,
				},
			} as RequestWithUser;

			const updatedUser = {
				username: 'username',
				password: 'password',
				email: 'test@provider.com',
				role: Role.User,
			} as UserPatchDto;

			try {
				await userService.patchUser(mockRequest, '1', updatedUser);
			} catch (error) {
				expect(error).toBeInstanceOf(ConflictException);
			}
		});

		it('should be able to update a user', async function () {
			jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(user1);
			jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(undefined);

			const mockRequest = {
				user: {
					id: '1',
					role: Role.User,
				},
			} as RequestWithUser;

			const updatedUser = {
				username: 'username',
				role: Role.User,
			} as UserPatchDto;

			const result = await userService.patchUser(mockRequest, '1', updatedUser);

			expect(result).toBeDefined();
		});
	});

	describe('delete user', () => {
		it('should throw an UnauthorizedException if no user with id is found', async function () {
			jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(undefined);
			jest.spyOn(userRepository, 'findOneOrFail').mockResolvedValueOnce(user1);

			const mockRequest = {
				user: {
					id: '1',
					role: Role.User,
				},
			} as RequestWithUser;

			try {
				await userService.deleteUser(mockRequest, '1');
			} catch (error) {
				expect(error).toBeInstanceOf(NotFoundException);
			}
		});

		it('should throw an UnauthorizedException the ids does not match', async function () {
			const mockRequest = {
				user: {
					id: '1',
					role: Role.User,
				},
			} as RequestWithUser;

			try {
				await userService.deleteUser(mockRequest, '2');
			} catch (error) {
				expect(error).toBeInstanceOf(UnauthorizedException);
			}
		});

		it('should return deleted:1 when deleting a user', async function () {
			jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(user1);
			jest.spyOn(userRepository, 'findOneOrFail').mockResolvedValueOnce(user1);

			const mockRequest = {
				user: {
					id: '1',
					role: Role.User,
				},
			} as RequestWithUser;

			const result = await userService.deleteUser(mockRequest, '1');
			expect(result).toStrictEqual({ deleted: 1 });
		});
	});

	describe('user exist', () => {
		it('should return true is the user exist', async function () {
			jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(user1);
			expect(await userService.userExist('1')).toBe(true);
		});

		it('should return false is the user does not exist', async function () {
			jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(undefined);
			expect(await userService.userExist('1')).toBe(false);
		});
	});
});
