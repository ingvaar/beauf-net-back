import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { UserService } from './user.service';
import { INestApplication } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserEntity } from './user.entity';
import { Role } from '../auth/roles/role.enum';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

describe('Users', () => {
	let app: INestApplication;
	let userService: UserService;
	let userRepository: Repository<UserEntity>;

	const user1 =
	{
		username: 'username1',
		id: '1',
		role: Role.Admin,
		password: 'password',
	}
	const user2 = {
		username: 'username2',
		id: '2',
		role: Role.User,
		password: 'password',
	}
	const user1Entity = Object.assign(new UserEntity(), user1);
	const user2Entity = Object.assign(new UserEntity(), user2);

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [],
			controllers: [UserController],
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
					}
				}]
		}).compile();

		userService = moduleRef.get(UserService);
		userRepository = moduleRef.get(getRepositoryToken(UserEntity));

		app = moduleRef.createNestApplication();
		await app.init();
	});

	it(`/GET users`, () => {
		jest.spyOn(userRepository, 'find').mockResolvedValue([user1Entity, user2Entity]);
		jest.spyOn(userRepository, 'count').mockResolvedValue(2);

		return request(app.getHttpServer())
			.get('/users')
			.expect(200)
			.expect({
				page: 1,
				perPage: 50,
				total: 2,
				users: [user1, user2]
			});
	});

	it(`/GET /users/{id}`, () => {
		jest.spyOn(userRepository, 'findOne').mockResolvedValue(user1Entity);

		return request(app.getHttpServer())
			.get('/users/1')
			.expect(200)
			.expect({
				user1
			});
	});

	afterAll(async () => {
		await app.close();
	});
});
