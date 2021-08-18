import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Role } from '../auth/roles/role.enum';
import { RequestWithUser } from '../user/user.utils';
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
		validated: true,
		createdAt: "123"
	});
	const quote1Public = new QuotePublicDto(quote1);
	const quote1Private = new QuotePrivateDto(quote1);
	const quote2 = Object.assign(new QuoteEntity(), {
		id: '2',
		text: "Quote 2",
		source: "Bob",
		validated: true,
		createdAt: "123"
	});
	const quote2Public = new QuotePublicDto(quote2);
	const quote2Private = new QuotePrivateDto(quote2);
	const quoteUnvalidated = Object.assign(new QuoteEntity(), {
		id: '3',
		text: "Quote 2",
		source: "Bob",
		validated: false,
		createdAt: "123"
	});
	const quoteUnvalidatedPublic = new QuotePublicDto(quoteUnvalidated);
	const quoteUnvalidatedPrivate = new QuotePrivateDto(quoteUnvalidated);

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

			await expect(quoteService.addQuote(newQuote)).resolves.toStrictEqual(quote1Public);
		});

		it('should save a new Quote with text and source', async function () {
			jest.spyOn(quoteRepository, 'save').mockResolvedValueOnce(quote1);

			const newQuote = {
				text: "Test",
				source: "source"
			} as QuoteCreationDto;

			await expect(quoteService.addQuote(newQuote)).resolves.toStrictEqual(quote1Public);
		});

		it('should save a new Quote with text, source and author', async function () {
			jest.spyOn(quoteRepository, 'save').mockResolvedValueOnce(quote1);

			const newQuote = {
				text: "Test",
				source: "source",
				author: "author"
			} as QuoteCreationDto;

			await expect(quoteService.addQuote(newQuote)).resolves.toStrictEqual(quote1Public);
		});
	});

	describe('get Quote', () => {
		it('should return the corresponding quote', async function () {
			quoteService.getQuoteEntity = jest.fn().mockReturnValueOnce(quote1);

			await expect(quoteService.getQuote('1')).resolves.toStrictEqual(quote1Public);
		});

		it('should fail because quote do not exist', async function () {
			quoteService.getQuoteEntity = jest.fn().mockRejectedValueOnce(new NotFoundException(`quote not found`));

			await expect(quoteService.getQuote('1')).rejects.toThrow(NotFoundException);
		});

		it('should fail because quote is not valid', async function () {
			quoteService.getQuoteEntity = jest.fn().mockReturnValueOnce(quoteUnvalidated);

			await expect(quoteService.getQuote('1')).rejects.toThrow(UnauthorizedException);
		});
	});

	describe('get Quotes', () => {
		it('should return quotes', async function () {
			jest.spyOn(quoteRepository, 'find').mockResolvedValueOnce([quote1, quote2]);
			jest.spyOn(quoteRepository, 'count').mockResolvedValue(2);

			await expect(quoteService.getQuotes(1, 50)).resolves.toStrictEqual({
				perPage: 50,
				page: 1,
				total: 2,
				data: [quote1Public, quote2Public]
			});
		});

		it('should return page 1 of size 1', async function () {
			jest.spyOn(quoteRepository, 'find').mockResolvedValueOnce([quote1]);
			jest.spyOn(quoteRepository, 'count').mockResolvedValue(2);

			await expect(quoteService.getQuotes(1, 1)).resolves.toStrictEqual({
				perPage: 1,
				page: 1,
				total: 2,
				data: [quote1Public]
			});
		});

		it('should return page 2 of size 1', async function () {
			jest.spyOn(quoteRepository, 'find').mockResolvedValueOnce([quote2]);
			jest.spyOn(quoteRepository, 'count').mockResolvedValue(2);

			await expect(quoteService.getQuotes(2, 1)).resolves.toStrictEqual({
				perPage: 1,
				page: 2,
				total: 2,
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

			await expect(quoteService.deleteQuote(mockRequest, '1')).resolves.toBeUndefined();
		});

		it("delete quote as user", async function () {
			jest.spyOn(quoteRepository, 'findOneOrFail').mockResolvedValueOnce(quote1);

			const mockRequest = {
				user: {
					id: '1',
					role: Role.User,
				},
			} as RequestWithUser;

			await expect(quoteService.deleteQuote(mockRequest, '1')).rejects.toThrow(UnauthorizedException);
		});
	});

	describe("update quote", () => {
		it("update quote as admin", async function () {
			jest.spyOn(quoteRepository, 'findOneOrFail').mockResolvedValueOnce(quote1);
			jest.spyOn(quoteRepository, 'save').mockResolvedValueOnce(quote1);

			const mockRequest = {
				user: {
					id: '1',
					role: Role.Admin,
				},
			} as RequestWithUser;

			await expect(quoteService.updateQuote(mockRequest, '1', {})).resolves.toStrictEqual(quote1Private);
		});

		it("update quote as user", async function () {
			jest.spyOn(quoteRepository, 'findOneOrFail').mockResolvedValueOnce(quote1);

			const mockRequest = {
				user: {
					id: '1',
					role: Role.User,
				},
			} as RequestWithUser;

			await expect(quoteService.updateQuote(mockRequest, '1', {})).rejects.toThrow(UnauthorizedException);
		});

		it("update quote author", async function () {
			const toUpdateAuthor = Object.assign(new QuoteEntity(), quote1);
			jest.spyOn(quoteRepository, 'findOneOrFail').mockResolvedValueOnce(toUpdateAuthor);
			jest.spyOn(quoteRepository, 'save').mockResolvedValueOnce(toUpdateAuthor);

			const mockRequest = {
				user: {
					id: '1',
					role: Role.Admin,
				},
			} as RequestWithUser;

			const toUpdateAuthorPrivate = new QuotePrivateDto(toUpdateAuthor);
			toUpdateAuthorPrivate.author = "new";
			await expect(quoteService.updateQuote(mockRequest, '1', { author: "new" })).resolves.toStrictEqual(toUpdateAuthorPrivate);
		});

		it("update quote text", async function () {
			const toUpdateText = Object.assign(new QuoteEntity(), quote1);
			jest.spyOn(quoteRepository, 'findOneOrFail').mockResolvedValueOnce(toUpdateText);
			jest.spyOn(quoteRepository, 'save').mockResolvedValueOnce(toUpdateText);

			const mockRequest = {
				user: {
					id: '1',
					role: Role.Admin,
				},
			} as RequestWithUser;

			const toUpdateTextPrivate = new QuotePrivateDto(toUpdateText);
			toUpdateTextPrivate.text = "new";
			await expect(quoteService.updateQuote(mockRequest, '1', { text: "new" })).resolves.toStrictEqual(toUpdateTextPrivate);
		});

		it("update quote source", async function () {
			const toUpdateSource = Object.assign(new QuoteEntity(), quote1);
			jest.spyOn(quoteRepository, 'findOneOrFail').mockResolvedValueOnce(toUpdateSource);
			jest.spyOn(quoteRepository, 'save').mockResolvedValueOnce(toUpdateSource);

			const mockRequest = {
				user: {
					id: '1',
					role: Role.Admin,
				},
			} as RequestWithUser;

			const toUpdateSourcePrivate = new QuotePrivateDto(toUpdateSource);
			toUpdateSourcePrivate.source = "new";
			await expect(quoteService.updateQuote(mockRequest, '1', { source: "new" })).resolves.toStrictEqual(toUpdateSourcePrivate);
		});
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

			await expect(quoteService.getPrivateQuote(mockRequest, '1')).resolves.toStrictEqual(quote1Private);
		});

		it("get private quote as user", async function () {
			jest.spyOn(quoteRepository, 'findOneOrFail').mockResolvedValueOnce(quote1);

			const mockRequest = {
				user: {
					id: '1',
					role: Role.User,
				},
			} as RequestWithUser;

			await expect(quoteService.getPrivateQuote(mockRequest, '1')).rejects.toThrow(UnauthorizedException);
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

			await expect(quoteService.getUnvalidatedQuotes(mockRequest, 1, 50)).resolves.toStrictEqual({
				perPage: 50,
				page: 1,
				total: 2,
				data: [quote1Private, quote2Private]
			});
		});

		it('should return page 1 of size 1', async function () {
			jest.spyOn(quoteRepository, 'find').mockResolvedValueOnce([quote1]);
			jest.spyOn(quoteRepository, 'count').mockResolvedValue(2);

			const mockRequest = {
				user: {
					id: '1',
					role: Role.Admin,
				},
			} as RequestWithUser;

			await expect(quoteService.getUnvalidatedQuotes(mockRequest, 1, 1)).resolves.toStrictEqual({
				perPage: 1,
				page: 1,
				total: 2,
				data: [quote1Private]
			});
		});

		it('should return page 2 of size 1', async function () {
			jest.spyOn(quoteRepository, 'find').mockResolvedValueOnce([quote2]);
			jest.spyOn(quoteRepository, 'count').mockResolvedValue(2);

			const mockRequest = {
				user: {
					id: '1',
					role: Role.Admin,
				},
			} as RequestWithUser;

			await expect(quoteService.getUnvalidatedQuotes(mockRequest, 2, 1)).resolves.toStrictEqual({
				perPage: 1,
				page: 2,
				total: 2,
				data: [quote2Private]
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

			await expect(quoteService.getUnvalidatedQuotes(mockRequest, 1, 50)).rejects.toThrow(UnauthorizedException);
		});
	});

	describe("validate quote", () => {
		it('should throw', async function () {
			jest.spyOn(quoteRepository, 'findOneOrFail').mockResolvedValueOnce(quote1);

			const mockRequest = {
				user: {
					id: '1',
					role: Role.User,
				},
			} as RequestWithUser;

			await expect(quoteService.validateQuote(mockRequest, '1')).rejects.toThrow(UnauthorizedException);
		});

		it('should return validated quote', async function () {
			jest.spyOn(quoteRepository, 'findOneOrFail').mockResolvedValueOnce(quote1);
			jest.spyOn(quoteRepository, 'save').mockResolvedValueOnce(quote1);

			const mockRequest = {
				user: {
					id: '1',
					role: Role.Admin,
				},
			} as RequestWithUser;

			await expect(quoteService.validateQuote(mockRequest, '1')).resolves.toStrictEqual(quote1Private);
		});
	});
});
