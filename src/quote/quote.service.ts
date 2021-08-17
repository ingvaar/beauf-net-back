import { Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { RequestWithUser } from "../user/user.utils";
import { Repository } from "typeorm";
import { QuoteCreationDto } from "./dto/quote.creation.dto";
import { QuotePatchDto } from "./dto/quote.patch.dto";
import { QuotePrivateDto } from "./dto/quote.private.dto";
import { QuotePublicDto } from "./dto/quote.public.dto";
import { QuoteEntity } from "./quote.entity";
import { Pagination } from "src/common/pagination";
import { Role } from "src/auth/roles/role.enum";

@Injectable()
export class QuoteService {
	constructor(
		@InjectRepository(QuoteEntity)
		private readonly quoteRepository: Repository<QuoteEntity>,
	) { }

	public async addQuote(newQuote: QuoteCreationDto): Promise<QuotePublicDto> {
		// TODO: Anti-spam security (captcha, Raph's way, etc...)

		let toSave = Object.assign(new QuoteEntity(), newQuote);

		return new QuotePublicDto(await this.quoteRepository.save(toSave));
	}

	public async getQuotes(
		page: number,
		perPage: number
	): Promise<{ page: number; perPage: number; total: number; data: Array<QuotePublicDto> }> {
		const pagination = Pagination.check(page, perPage);
		const total = await this.quoteRepository.count();
		const result = await this.quoteRepository.find({
			skip: (pagination.page - 1) * pagination.perPage,
			take: pagination.perPage,
		});
		const datas = new Array<QuotePublicDto>();
		result.forEach(entity => datas.push(new QuotePublicDto(entity)));

		return { page: pagination.page, perPage: pagination.perPage, total: total, data: datas };
	}

	public async getUnvalidatedQuotes(
		request: RequestWithUser,
		page: number,
		perPage: number,
	): Promise<{ page: number; perPage: number; total: number; data: Array<QuotePrivateDto> }> {
		if (request.user.role != Role.Admin) {
			throw new UnauthorizedException(`user is not admin`);
		}
		const pagination = Pagination.check(page, perPage);
		const total = await this.quoteRepository.count();
		const result = await this.quoteRepository.find({
			skip: (pagination.page - 1) * pagination.perPage,
			take: pagination.perPage,
		});
		const datas = new Array<QuotePrivateDto>();
		result.forEach(entity => datas.push(new QuotePublicDto(entity)));

		return { page: pagination.page, perPage: pagination.perPage, total: total, data: datas };
	}

	public async getQuote(id: string): Promise<QuotePublicDto> {
		return new QuotePublicDto(new QuoteEntity());
	}

	public async getPrivateQuote(request: RequestWithUser, id: string): Promise<QuotePrivateDto> {
		return new QuotePrivateDto(new QuoteEntity());
	}

	public async deleteQuote(request: RequestWithUser, id: string) {
	}

	public async updateQuote(request: RequestWithUser, id: string, updatedQuote: QuotePatchDto): Promise<QuotePrivateDto> {
		return new QuotePrivateDto(new QuoteEntity());
	}

	public async validateQuote(request: RequestWithUser, id: string): Promise<QuotePrivateDto> {
		return new QuotePrivateDto(new QuoteEntity());
	}
}