import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
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
});
