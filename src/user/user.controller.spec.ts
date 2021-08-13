import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { Role } from '../auth/roles/role.enum';
import { UserCreationDto } from './dto/user.creation.dto';
import { UserPatchDto } from './dto/user.patch.dto';
import { UserController } from './user.controller';
import { UserEntity } from './user.entity';
import { UserService } from './user.service';
import { RequestWithUser } from './user.utils';

describe('User Controller', () => {
	let controller: UserController;
	let userService: UserService;

	const user1 = Object.assign(new UserEntity(), { username: 'username1', id: '1' });
	const user2 = Object.assign(new UserEntity(), { username: 'username2', id: '2' });

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			controllers: [UserController],
			providers: [
				{
					provide: UserService,
					useValue: {
						getUsers: jest.fn(),
						getUser: jest.fn(),
						saveUser: jest.fn(),
						patchUser: jest.fn(),
						deleteUser: jest.fn(),
					},
				},
			],
		}).compile();

		controller = module.get(UserController);
		userService = module.get(UserService);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('Get users', () => {
		it('should get an array of users', async () => {
			const mockedResult = { page: 1, perPage: 50, total: 2, users: [user1, user2] };
			jest.spyOn(userService, 'getUsers').mockResolvedValue(mockedResult);

			const result = await controller.getUsers(1, 50);

			expect(result).toHaveProperty('users');
			expect(result.users).toStrictEqual([user1, user2]);
		});
	});

	describe('Get user', () => {
		it('should get a user', async () => {
			jest.spyOn(userService, 'getUser').mockResolvedValue(user1);

			const mockRequest = {
				user: {
					id: '1',
					role: Role.User,
				},
			} as RequestWithUser;

			const result = await controller.getUser(mockRequest, '1');

			expect(result).toStrictEqual(user1);
		});
	});

	describe('Post user', () => {
		it('should post a user while being admin', async () => {
			jest.spyOn(userService, 'saveUser').mockResolvedValue(user1);

			const mockRequest = {
				user: {
					id: '1',
					role: Role.Admin,
				},
			} as RequestWithUser;

			const newUser = {
				username: 'newUsername',
				password: 'newPassword',
			} as UserCreationDto;

			const result = await controller.postUser(mockRequest, newUser);

			expect(result).toStrictEqual(user1);
		});

		it('should throw while trying to post an user without being admin', async () => {
			jest.spyOn(userService, 'saveUser').mockResolvedValue(user1);

			const mockRequest = {
				user: {
					id: '1',
					role: Role.User,
				},
			} as RequestWithUser;

			const newUser = {
				username: 'newUsername',
				password: 'newPassword',
			} as UserCreationDto;

			try {
				await controller.postUser(mockRequest, newUser);
			} catch (error) {
				expect(error).toBeInstanceOf(UnauthorizedException);
			}
		});
	});

	describe('Patch user', () => {
		it('should patch a user', async () => {
			jest.spyOn(userService, 'patchUser').mockResolvedValue(user1);

			const mockRequest = {
				user: {
					id: '1',
					role: Role.User,
				},
			} as RequestWithUser;

			const patchedUser = {
				username: 'newUsername',
				password: 'newPassword',
			} as UserPatchDto;

			const result = await controller.patchUser(mockRequest, patchedUser, '1');

			expect(result).toStrictEqual(user1);
		});
	});

	describe('Delete user', () => {
		it('should delete a user', async () => {
			jest.spyOn(userService, 'deleteUser').mockResolvedValue({ deleted: 1 });

			const mockRequest = {
				user: {
					id: '1',
					role: Role.User,
				},
			} as RequestWithUser;

			const result = await controller.deleteUser(mockRequest, '1');

			expect(result).toStrictEqual({ deleted: 1 });
		});
	});
});
