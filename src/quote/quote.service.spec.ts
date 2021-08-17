import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Role } from 'src/auth/roles/role.enum';
import { RequestWithUser } from 'src/user/user.utils';
import { Repository } from 'typeorm';

import { QuoteCreationDto } from './dto/quote.creation.dto';
import { QuotePrivateDto } from './dto/quote.private.dto';
import { QuotePublicDto } from './dto/quote.public.dto';
import { QuoteEntity } from './quote.entity';
import { QuoteService } from './quote.service';

describe('Quote Service', () => {
	let quoteService: QuoteService;
	let quoteRepository: Repository<QuoteEntity>;

	const quote1 = Object.assign(new QuoteEntity(), {
		id: '1',
		text: "Quote 1",
		source: "Michel",
		createdAt: "123"
	});
	const quote1Public = new QuotePublicDto(quote1);
	const quote1Private = new QuotePrivateDto(quote1);
	const quote2 = Object.assign(new QuoteEntity(), {
		id: '2',
		text: "Quote 2",
		source: "Bob",
		createdAt: "123"
	});
	const quote2Public = new QuotePublicDto(quote2);
	const quote2Private = new QuotePrivateDto(quote2);

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [
				QuoteService,
				{
					provide: getRepositoryToken(QuoteEntity),
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

		quoteService = module.get(QuoteService);
		quoteRepository = module.get(getRepositoryToken(QuoteEntity));
	});

	it('should be defined', () => {
		expect(quoteService).toBeDefined();
		expect(quoteRepository).toBeDefined();
	});

	describe('save Quote', () => {
		it('should save a new Quote with only text', async function () {
			jest.spyOn(quoteRepository, 'save').mockResolvedValueOnce(quote1);

			const newQuote = {
				text: "Test"
			} as QuoteCreationDto;

			expect(await quoteService.addQuote(newQuote)).toStrictEqual(quote1Public);
		});

		it('should save a new Quote with text and source', async function () {
			jest.spyOn(quoteRepository, 'save').mockResolvedValueOnce(quote1);

			const newQuote = {
				text: "Test",
				source: "source"
			} as QuoteCreationDto;

			expect(await quoteService.addQuote(newQuote)).toStrictEqual(quote1Public);
		});

		it('should save a new Quote with text, source and author', async function () {
			jest.spyOn(quoteRepository, 'save').mockResolvedValueOnce(quote1);

			const newQuote = {
				text: "Test",
				source: "source",
				author: "author"
			} as QuoteCreationDto;

			expect(await quoteService.addQuote(newQuote)).toStrictEqual(quote1Public);
		});
	});

	describe('get Quote', () => {
		it('should return the corresponding quote', async function () {
			jest.spyOn(quoteRepository, 'findOneOrFail').mockResolvedValueOnce(quote1);

			expect(await quoteService.getQuote('1')).toStrictEqual(quote1Public);
		});

		it('should fail because quote do not exist', async function () {
			jest.spyOn(quoteRepository, 'findOneOrFail').mockRejectedValueOnce(new Error('Not found'));

			expect(await quoteService.getQuote('1')).toStrictEqual(quote1Public);
		});
	});

	describe('get Quotes', () => {
		it('should return quotes', async function () {
			jest.spyOn(quoteRepository, 'find').mockResolvedValueOnce([quote1, quote2]);
			jest.spyOn(quoteRepository, 'count').mockResolvedValue(2);

			expect(await quoteService.getQuotes(1, 50)).toStrictEqual({
				perPage: 50,
				page: 1,
				count: 2,
				data: [quote1Public, quote2Public]
			});
		});

		it('should return page 1 of size 1', async function () {
			jest.spyOn(quoteRepository, 'find').mockRejectedValueOnce([quote1]);
			jest.spyOn(quoteRepository, 'count').mockResolvedValue(1);

			expect(await quoteService.getQuotes(1, 1)).toStrictEqual({
				perPage: 1,
				page: 1,
				count: 1,
				data: [quote1Public]
			});
		});

		it('should return page 2 of size 1', async function () {
			jest.spyOn(quoteRepository, 'find').mockRejectedValueOnce([quote2]);
			jest.spyOn(quoteRepository, 'count').mockResolvedValue(1);

			expect(await quoteService.getQuotes(1, 2)).toStrictEqual({
				perPage: 1,
				page: 2,
				count: 1,
				data: [quote2Public]
			});
		});
	});

	describe("delete quote", () => {
		it("delete quote as admin", async function () {
			jest.spyOn(quoteRepository, 'findOneOrFail').mockResolvedValueOnce(quote1);

			const mockRequest = {
				user: {
					id: '1',
					role: Role.Admin,
				},
			} as RequestWithUser;

			expect(await quoteService.deleteQuote(mockRequest, '1')).toHaveReturned();
		});

		it("delete quote as user", async function () {
			jest.spyOn(quoteRepository, 'findOneOrFail').mockResolvedValueOnce(quote1);

			const mockRequest = {
				user: {
					id: '1',
					role: Role.User,
				},
			} as RequestWithUser;

			expect(await quoteService.deleteQuote(mockRequest, '1')).toThrowError(UnauthorizedException);
		});
	});

	describe("update quote", () => {

	});

	describe("get private quote", () => {
		it("get private quote as admin", async function () {
			jest.spyOn(quoteRepository, 'findOneOrFail').mockResolvedValueOnce(quote1);

			const mockRequest = {
				user: {
					id: '1',
					role: Role.Admin,
				},
			} as RequestWithUser;

			expect(await quoteService.getPrivateQuote(mockRequest, '1')).toStrictEqual(quote1Private);
		});

		it("get private quote as user", async function () {
			jest.spyOn(quoteRepository, 'findOneOrFail').mockResolvedValueOnce(quote1);

			const mockRequest = {
				user: {
					id: '1',
					role: Role.User,
				},
			} as RequestWithUser;

			expect(await quoteService.deleteQuote(mockRequest, '1')).toThrowError(UnauthorizedException);
		});
	});

	describe("get unvalidated quotes", () => {
		it('should return private quotes', async function () {
			jest.spyOn(quoteRepository, 'find').mockResolvedValueOnce([quote1, quote2]);
			jest.spyOn(quoteRepository, 'count').mockResolvedValue(2);

			const mockRequest = {
				user: {
					id: '1',
					role: Role.Admin,
				},
			} as RequestWithUser;

			expect(await quoteService.getUnvalidatedQuotes(mockRequest, 1, 50)).toStrictEqual({
				perPage: 50,
				page: 1,
				count: 2,
				data: [quote1Private, quote2Private]
			});
		});

		it('should return page 1 of size 1', async function () {
			jest.spyOn(quoteRepository, 'find').mockRejectedValueOnce([quote1]);
			jest.spyOn(quoteRepository, 'count').mockResolvedValue(1);

			const mockRequest = {
				user: {
					id: '1',
					role: Role.Admin,
				},
			} as RequestWithUser;

			expect(await quoteService.getUnvalidatedQuotes(mockRequest, 1, 1)).toStrictEqual({
				perPage: 1,
				page: 1,
				count: 1,
				data: [quote1Private]
			});
		});

		it('should return page 2 of size 1', async function () {
			jest.spyOn(quoteRepository, 'find').mockRejectedValueOnce([quote2]);
			jest.spyOn(quoteRepository, 'count').mockResolvedValue(1);

			const mockRequest = {
				user: {
					id: '1',
					role: Role.Admin,
				},
			} as RequestWithUser;

			expect(await quoteService.getUnvalidatedQuotes(mockRequest, 1, 2)).toStrictEqual({
				perPage: 1,
				page: 2,
				count: 1,
				data: [quote2Public]
			});
		});

		it('should throw', async function () {
			jest.spyOn(quoteRepository, 'find').mockResolvedValueOnce([quote1, quote2]);
			jest.spyOn(quoteRepository, 'count').mockResolvedValue(2);

			const mockRequest = {
				user: {
					id: '1',
					role: Role.User,
				},
			} as RequestWithUser;

			expect(await quoteService.getUnvalidatedQuotes(mockRequest, 1, 50)).toThrowError(UnauthorizedException);
		});
	});

	describe("validate quote", () => {

	});
});
