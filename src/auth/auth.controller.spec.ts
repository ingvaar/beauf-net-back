import { Test } from '@nestjs/testing';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('Auth Controller', () => {
	let controller: AuthController;
	let authService: AuthService;

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			controllers: [AuthController],
			providers: [
				{
					provide: AuthService,
					useValue: {
						login: jest.fn(),
					},
				},
			],
		}).compile();

		controller = module.get(AuthController);
		authService = module.get(AuthService);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('Login', () => {
		it('should call the login service when calling the login controller', async () => {
			const tokenValue = 'mockedReturnedToken';
			jest.spyOn(authService, 'login').mockResolvedValue(tokenValue);

			const result = await controller.login({ identifier: 'username', password: 'password' });

			expect(result).toHaveProperty('token');
			expect(result.token).toEqual(tokenValue);
		});
	});
});
