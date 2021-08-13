import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { RequestWithUser } from "../user/user.utils";
import { Repository } from "typeorm";
import { QuoteCreationDto } from "./dto/quote.creation.dto";
import { QuotePatchDto } from "./dto/quote.patch.dto";
import { QuotePrivateDto } from "./dto/quote.private.dto";
import { QuotePublicDto } from "./dto/quote.public.dto";
import { QuoteEntity } from "./quote.entity";

@Injectable()
export class QuoteService {
	constructor(
		@InjectRepository(QuoteEntity)
		private readonly quoteRepository: Repository<QuoteEntity>
	) { }

	public async addQuote(newQuote: QuoteCreationDto): Promise<QuotePublicDto> {
		return new QuotePublicDto();
	}

	public async getQuotes(
		page: number,
		perPage: number
	): Promise<{ page: number; perPage: number; total: number; data: Array<QuotePublicDto> }> {
		return {
			page: page,
			perPage: perPage,
			total: 0,
			data: new Array
		};
	}

	public async getUnvalidatedQuotes(
		request: RequestWithUser,
		page: number,
		perPage: number,
	): Promise<{ page: number; perPage: number; total: number; data: Array<QuotePrivateDto> }> {
		return {
			page: page,
			perPage: perPage,
			total: 0,
			data: new Array
		};
	}

	public async getQuote(id: string): Promise<QuotePublicDto> {
		return new QuotePublicDto();
	}

	public async getPrivateQuote(request: RequestWithUser, id: string): Promise<QuotePrivateDto> {
		return new QuotePrivateDto();
	}

	public async deleteQuote(request: RequestWithUser, id: string) {
	}

	public async updateQuote(request: RequestWithUser, id: string, updatedQuote: QuotePatchDto): Promise<QuotePrivateDto> {
		return new QuotePrivateDto();
	}

	public async validateQuote(request: RequestWithUser, id: string): Promise<QuotePrivateDto> {
		return new QuotePrivateDto();
	}
}