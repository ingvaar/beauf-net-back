import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt/dist/jwt.service';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';

import { UserEntity } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { Role } from './roles/role.enum';

describe('Auth Service', () => {
	let authService: AuthService;
	let userService: UserService;
	let jwtService: JwtService;

	const user1 = Object.assign(new UserEntity(), {
		username: 'username1',
		id: '1',
		role: Role.User,
		password: 'password',
		validated: true,
	});

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [
				AuthService,
				{
					provide: UserService,
					useValue: {
						getUserByUsername: jest.fn(),
						getUserByEmail: jest.fn(),
						getUser: jest.fn(),
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
			],
		}).compile();

		authService = module.get(AuthService);
		userService = module.get(UserService);
		jwtService = module.get(JwtService);
	});

	it('should be defined', () => {
		expect(authService).toBeDefined();
		expect(userService).toBeDefined();
		expect(jwtService).toBeDefined();
	});

	describe('Login', () => {
		it('should be able to get a token with correct credentials', async () => {
			const credentials = { identifier: 'username', password: 'password' };

			jest.spyOn(userService, 'getUserByUsername').mockResolvedValueOnce(user1);
			jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true as never);
			jest.spyOn(authService, 'validateUser').mockResolvedValueOnce(user1);

			expect(await authService.login(credentials)).toEqual('token');
		});

		it('should throw unauthorized exception with incorrect credentials', async () => {
			const credentials = { identifier: 'username', password: 'incorrectPassword' };

			try {
				await authService.login(credentials);
			} catch (error) {
				expect(error).toBeInstanceOf(BadRequestException);
			}
		});
	});

	describe('ValidateUser', () => {
		it('should return the user entity if the credentials match', async () => {
			jest.spyOn(userService, 'getUserByUsername').mockResolvedValueOnce(user1);
			jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true as never);

			expect(await authService.validateUser('username', 'password')).toBeInstanceOf(UserEntity);
		});

		it('should throw an UnauthorizedException with incorrect credentials', async () => {
			jest.spyOn(userService, 'getUserByUsername').mockResolvedValueOnce(
				Object.assign(new UserEntity(), {
					username: 'username1',
					id: '1',
					role: Role.User,
					validated: true,
				}),
			);
			jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false as never);

			try {
				await authService.validateUser('username', 'incorrectPassword');
			} catch (error) {
				expect(error).toBeInstanceOf(UnauthorizedException);
			}
		});

		it('should throw an UnauthorizedException if the identifier does not belong to a user', async () => {
			jest.spyOn(userService, 'getUserByUsername').mockRejectedValueOnce(new Error());
			jest.spyOn(userService, 'getUserByEmail').mockRejectedValueOnce(new Error());

			try {
				await authService.validateUser('username', 'password');
			} catch (error) {
				expect(error).toBeInstanceOf(BadRequestException);
			}
		});
	});

	describe('UserFromToken', () => {
		it('should return the user entity if the payload is valid', async () => {
			jest.spyOn(userService, 'getUser').mockResolvedValueOnce(user1);

			expect(await authService.userFromToken('validPayload')).toBeInstanceOf(UserEntity);
		});

		it('should throw an UnauthorizedException if the payload is invalid', async () => {
			try {
				await authService.userFromToken('invalidPayload');
			} catch (error) {
				expect(error).toBeInstanceOf(UnauthorizedException);
			}
		});
		it('should throw an UnauthorizedException if the payload is invalid', async () => {
			jest.spyOn(userService, 'getUser').mockRejectedValueOnce(new Error());
			try {
				await authService.userFromToken('validPayloadInvalidUserId');
			} catch (error) {
				expect(error).toBeInstanceOf(UnauthorizedException);
			}
		});
	});
});
