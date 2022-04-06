import {
	ConflictException,
	Logger,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GoogleService } from '../services/google/google.service';
import { Role } from '../auth/roles/role.enum';
import { UserCreationDto } from './dto/user.creation.dto';
import { UserPatchDto } from './dto/user.patch.dto';
import { UserPrivateDto } from './dto/user.private.dto';
import { UserPublicDto } from './dto/user.public.dto';
import { UserEntity } from './user.entity';
import { UserService } from './user.service';
import { RequestWithUser } from './user.utils';
import { MailService } from '../services/mail/mail.service';
import { JwtService } from '@nestjs/jwt';

describe('User Service', () => {
	let userService: UserService;
	let userRepository: Repository<UserEntity>;
	let googleService: GoogleService;
	let mailService: MailService;

	const user1 = Object.assign(new UserEntity(), {
		username: 'username1',
		id: '1',
		role: Role.Admin,
		password: 'password',
	});
	const user1Private = new UserPrivateDto(user1);
	const user1Public = new UserPublicDto(user1);
	const user2 = Object.assign(new UserEntity(), {
		username: 'username2',
		id: '2',
		role: Role.User,
		password: 'password',
	});
	const user2Private = new UserPrivateDto(user2);
	const user2Public = new UserPublicDto(user2);

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
				{
					provide: JwtService,
					useValue: {
						sign: jest.fn(() => {
							return 'token';
						}),
						decode: jest.fn((payload: string) => {
							if (payload == 'validPayload') {
								return { userID: 1 };
							}
							if (payload == 'validPayloadInvalidUserId') {
								return { userID: 2 };
							}
						}),
					},
				},
				{
					provide: GoogleService,
					useValue: {
						verifyCaptcha: jest.fn(),
					},
				},
				{
					provide: MailService,
					useValue: {
						sendEmailConfirmation: jest.fn(),
					},
				},
			],
		}).compile();

		userService = module.get(UserService);
		userRepository = module.get(getRepositoryToken(UserEntity));
		googleService = module.get(GoogleService);
		mailService = module.get(MailService);
	});

	it('should be defined', () => {
		expect(userService).toBeDefined();
		expect(userRepository).toBeDefined();
		expect(googleService).toBeDefined();
		expect(mailService).toBeDefined();
	});

	describe('get users', () => {
		it('should get users', async function () {
			jest.spyOn(userRepository, 'find').mockResolvedValue([user1, user2]);
			jest.spyOn(userRepository, 'count').mockResolvedValue(2);

			await expect(userService.getUsers(1, 50)).resolves.toStrictEqual({ page: 1, perPage: 50, total: 2, data: [user1Public, user2Public] });
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

			await expect(userService.getUser('1', mockRequest)).resolves.toEqual(user1Private);
		});

		it('should throw a NotFoundException if no user is found', async function () {
			jest.spyOn(userRepository, 'findOneOrFail').mockRejectedValueOnce(Error);

			await expect(userService.getUser('1')).rejects.toThrow(NotFoundException);
		});

		it("should throw a UnauthorizedException if the userId from the token's payload does not correspond to an existing user", async function () {
			const mockRequest = {
				user: {
					id: '3',
					role: Role.User,
				},
			} as RequestWithUser;
			jest.spyOn(userRepository, 'findOneOrFail').mockResolvedValueOnce(user1);
			jest.spyOn(userRepository, 'findOneOrFail').mockRejectedValueOnce(Error);

			await expect(userService.getUser('1', mockRequest)).rejects.toThrow(UnauthorizedException);
		});

		it("should return a public dto if the userId from the token's payload does not correspond to the passed id and the role is not admin", async function () {
			const mockRequest = {
				user: {
					id: '1',
					role: Role.User,
				},
			} as RequestWithUser;
			jest.spyOn(userRepository, 'findOneOrFail').mockResolvedValueOnce(user1);
			jest.spyOn(userRepository, 'findOneOrFail').mockResolvedValueOnce(user2);

			await expect(userService.getUser('1', mockRequest)).resolves.toStrictEqual(new UserPublicDto(user1));
		});
	});

	describe('get user role', () => {
		it('should get the user roles', async function () {
			jest.spyOn(userRepository, 'findOneOrFail').mockResolvedValueOnce(user1);

			await expect(userService.getUserRole('1')).resolves.toBe(user1.role);
		});

		it('should throw if the user is not found', async function () {
			jest.spyOn(userRepository, 'findOneOrFail').mockRejectedValue(new Error('Not found error'));

			await expect(userService.getUserRole('1')).rejects.toThrow(NotFoundException);
		});
	});

	describe('get user by username', () => {
		it('should get a user by his username', async function () {
			jest.spyOn(userRepository, 'findOneOrFail').mockResolvedValueOnce(user1);

			await expect(userService.getUserByUsername('1')).resolves.toStrictEqual(user1);
		});

		it('should throw if the user is not found', async function () {
			jest.spyOn(userRepository, 'findOneOrFail').mockRejectedValue(Error);

			await expect(userService.getUserByUsername('1')).rejects.toThrow(NotFoundException);
		});
	});

	describe('get user by email', () => {
		it('should get a user by his email', async function () {
			jest.spyOn(userRepository, 'findOneOrFail').mockResolvedValueOnce(user1);

			await expect(userService.getUserByEmail('1')).resolves.toStrictEqual(user1);
		});

		it('should throw if the user is not found', async function () {
			jest.spyOn(userRepository, 'findOneOrFail').mockRejectedValue(Error);

			await expect(userService.getUserByEmail('1')).rejects.toThrow(NotFoundException);
		});
	});

	describe('get user entity by id', () => {
		it('should get a user by his email', async function () {
			jest.spyOn(userRepository, 'findOneOrFail').mockResolvedValueOnce(user1);

			await expect(userService.getUserEntityById('1')).resolves.toBe(user1);
		});

		it('should throw if the user is not found', async function () {
			jest.spyOn(userRepository, 'findOneOrFail').mockRejectedValue(Error);

			await expect(userService.getUserEntityById('1')).rejects.toThrow(NotFoundException);
		});
	});

	describe('onApplicationBootstrap', () => {
		it('should do nothing if admin already exists', async function () {
			const admin = Object.assign(new UserEntity(), {
				username: 'admin',
				id: '1',
				role: Role.Admin,
				password: 'password',
			});
			jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(admin);
			const consoleSpy = jest.spyOn(Logger, 'log');

			await userService.onApplicationBootstrap();

			expect(consoleSpy.mock.calls[0][0]).toContain("Admin already created.");
		});
	});

	describe('save user', () => {
		it('should be able to save a user', async function () {
			jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(undefined);
			jest.spyOn(userRepository, 'save').mockResolvedValueOnce(user1);
			jest.spyOn(googleService, 'verifyCaptcha').mockResolvedValueOnce(true);

			const newUser = {
				username: 'username',
				password: 'password',
				email: 'test@provider.com',
				role: Role.User,
				captcha: 'test',
			} as UserCreationDto;

			await expect(userService.saveUser(newUser)).resolves.toStrictEqual(user1Private);
		});

		it('should throw if a user with the same username already exist', async function () {
			jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(user1);
			jest.spyOn(googleService, 'verifyCaptcha').mockResolvedValueOnce(true);

			const newUser = {
				username: 'username',
				password: 'password',
				email: 'test@provider.com',
				role: Role.User,
				captcha: 'test',
			} as UserCreationDto;

			await expect(userService.saveUser(newUser)).rejects.toThrow(ConflictException);
		});

		it('should throw if a user with the same email already exist', async function () {
			jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(undefined).mockResolvedValueOnce(user1);
			jest.spyOn(googleService, 'verifyCaptcha').mockResolvedValueOnce(true);

			const newUser = {
				username: 'username',
				password: 'password',
				email: 'test@provider.com',
				role: Role.User,
				captcha: 'test',
			} as UserCreationDto;

			await expect(userService.saveUser(newUser)).rejects.toThrow(ConflictException);
		});
	});

	describe('patch user', () => {
		it('should throw a NotFoundException if no user with id is found', async function () {
			jest.spyOn(userRepository, 'findOneOrFail').mockRejectedValueOnce(Error);

			const mockRequest = {
				user: {
					id: '1',
					role: Role.Admin,
				},
			} as RequestWithUser;

			const updatedUser = {
				username: 'username',
				password: 'password',
				role: Role.User,
			} as UserPatchDto;

			await expect(userService.patchUser(mockRequest, '1', updatedUser)).rejects.toThrow(NotFoundException);
		});

		it('should throw an UnauthorizedException if the logged in user is different', async function () {
			jest.spyOn(userRepository, 'findOneOrFail').mockResolvedValueOnce(user2).mockResolvedValueOnce(user1);

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

			await expect(userService.patchUser(mockRequest, '2', updatedUser)).rejects.toThrow(UnauthorizedException);
		});

		it('should be able to hash the password', async function () {
			jest.spyOn(userRepository, 'findOneOrFail').mockResolvedValueOnce(user1);
			jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(undefined);
			jest.spyOn(userRepository, 'save').mockResolvedValueOnce(user1);

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
			const user1PrivateUpdated = new UserPrivateDto(user1);
			expect(result).toStrictEqual(user1PrivateUpdated);
		});

		it('should throw a ConflictException if the new username is not unique', async function () {
			jest.spyOn(userRepository, 'findOneOrFail').mockResolvedValueOnce(user1);
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

			await expect(userService.patchUser(mockRequest, '1', updatedUser)).rejects.toThrow(ConflictException);
		});

		it('should throw a ConflictException if the new email is not unique', async function () {
			jest.spyOn(userRepository, 'findOneOrFail').mockResolvedValueOnce(user1);
			jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(undefined).mockResolvedValueOnce(user1);

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

			await expect(userService.patchUser(mockRequest, '1', updatedUser)).rejects.toThrow(ConflictException);
		});

		it('should be able to update a user', async function () {
			jest.spyOn(userRepository, 'findOneOrFail').mockResolvedValueOnce(user1)
			jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(undefined);
			jest.spyOn(userRepository, 'save').mockResolvedValueOnce(user1);

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

			await expect(userService.patchUser(mockRequest, '1', updatedUser)).resolves.toBeDefined();
		});

		it('should not update user role as user', async function () {
			jest.spyOn(userRepository, 'findOneOrFail').mockResolvedValueOnce(user1);
			jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(undefined);
			jest.spyOn(userRepository, 'save').mockResolvedValueOnce(user1);

			const mockRequest = {
				user: {
					id: '1',
					role: Role.Admin,
				},
			} as RequestWithUser;

			const updatedUser = {
				role: Role.Admin,
			} as UserPatchDto;

			const result = await userService.patchUser(mockRequest, '1', updatedUser);
			const user1PrivateUpdated = new UserPrivateDto(user1);
			expect(result).toStrictEqual(user1PrivateUpdated);
		});
	});

	describe('delete user', () => {
		it('should throw an UnauthorizedException if no user with id is found', async function () {
			jest.spyOn(userRepository, 'findOneOrFail').mockRejectedValueOnce(Error);

			const mockRequest = {
				user: {
					id: '1',
					role: Role.User,
				},
			} as RequestWithUser;

			await expect(userService.deleteUser(mockRequest, '1')).rejects.toThrow(NotFoundException);
		});

		it('should throw an UnauthorizedException the ids does not match', async function () {
			jest.spyOn(userRepository, 'findOneOrFail').mockResolvedValueOnce(user2);
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

		it('should not throw when deleting a user', async function () {
			jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(user1);
			jest.spyOn(userRepository, 'findOneOrFail').mockResolvedValueOnce(user1);

			const mockRequest = {
				user: {
					id: '1',
					role: Role.User,
				},
			} as RequestWithUser;

			await expect(userService.deleteUser(mockRequest, '1')).resolves.toBeUndefined();
		});
	});

	describe('user exist', () => {
		it('should return true is the user exist', async function () {
			jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(user1);

			await expect(userService.userExist('1')).resolves.toBe(true);
		});

		it('should return false is the user does not exist', async function () {
			jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(undefined);

			await expect(userService.userExist('1')).resolves.toBe(false);
		});
	});
});
