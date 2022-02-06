import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { RequestWithUser } from "../user/user.utils";
import { Repository } from "typeorm";
import { QuoteCreationDto } from "./dto/quote.creation.dto";
import { QuotePatchDto } from "./dto/quote.patch.dto";
import { QuotePrivateDto } from "./dto/quote.private.dto";
import { QuotePublicDto } from "./dto/quote.public.dto";
import { QuoteEntity } from "./quote.entity";
import { Pagination } from "../common/pagination";
import { Role } from "../auth/roles/role.enum";
import { GoogleService } from "../services/google/google.service";

@Injectable()
export class QuoteService {
	constructor(
		@InjectRepository(QuoteEntity)
		private readonly quoteRepository: Repository<QuoteEntity>,
		private readonly googleService: GoogleService,
	) { }

	public async addQuote(newQuote: QuoteCreationDto): Promise<QuotePublicDto> {
		if (await this.googleService.verifyCaptcha(newQuote.captcha) == false) {
			throw new BadRequestException("invalid captcha");
		}

		let toSave = Object.assign(new QuoteEntity(), newQuote);

		return new QuotePublicDto(await this.quoteRepository.save(toSave));
	}

	public async getQuotes(
		page: number,
		perPage: number
	): Promise<{ page: number; perPage: number; total: number; data: Array<QuotePublicDto> }> {
		const pagination = Pagination.check(page, perPage);
		const total = await this.quoteRepository.count({
			where: { validated: true }
		});
		const result = await this.quoteRepository.find({
			skip: (pagination.page - 1) * pagination.perPage,
			take: pagination.perPage,
			where: { validated: true },
			order: { createdAt: 'DESC' },
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
		const total = await this.quoteRepository.count({
			where: { validated: false }
		});
		const result = await this.quoteRepository.find({
			skip: (pagination.page - 1) * pagination.perPage,
			take: pagination.perPage,
			where: { validated: false },
			order: { createdAt: 'ASC' },
		});
		const datas = new Array<QuotePrivateDto>();
		result.forEach(entity => datas.push(new QuotePrivateDto(entity)));

		return { page: pagination.page, perPage: pagination.perPage, total: total, data: datas };
	}

	public async getQuoteEntity(id: string): Promise<QuoteEntity> {
		try {
			return await this.quoteRepository.findOneOrFail(id);
		} catch (error) {
			throw new NotFoundException(`no quote with id ${id} found`);
		}
	}

	public async getQuote(id: string): Promise<QuotePublicDto> {
		const quote = await this.getQuoteEntity(id);

		if (!quote.validated) {
			throw new UnauthorizedException(`quote is not validated`);
		}

		return new QuotePublicDto(quote);
	}

	public async getPrivateQuote(request: RequestWithUser, id: string): Promise<QuotePrivateDto> {
		if (request.user.role != Role.Admin) {
			throw new UnauthorizedException(`user is not admin`);
		}
		return new QuotePrivateDto(await this.getQuoteEntity(id));
	}

	public async deleteQuote(request: RequestWithUser, id: string) {
		if (request.user.role != Role.Admin) {
			throw new UnauthorizedException(`user is not admin`);
		}
		const toDelete = await this.getQuoteEntity(id);
		await this.quoteRepository.remove(toDelete);
	}

	public async updateQuote(request: RequestWithUser, id: string, updatedQuote: QuotePatchDto): Promise<QuotePrivateDto> {
		if (request.user.role != Role.Admin) {
			throw new UnauthorizedException(`user is not admin`);
		}
		const toUpdate = await this.getQuoteEntity(id);

		if (updatedQuote.author != undefined) {
			toUpdate.author = updatedQuote.author;
		}

		if (updatedQuote.source != undefined) {
			toUpdate.source = updatedQuote.source;
		}

		if (updatedQuote.text != undefined) {
			toUpdate.text = updatedQuote.text;
		}

		return new QuotePrivateDto(await this.quoteRepository.save(toUpdate));
	}

	public async validateQuote(request: RequestWithUser, id: string): Promise<QuotePrivateDto> {
		if (request.user.role != Role.Admin) {
			throw new UnauthorizedException(`user is not admin`);
		}
		const toValidate = await this.getQuoteEntity(id);
		toValidate.validated = true;
		return new QuotePrivateDto(await this.quoteRepository.save(toValidate));
	}

	public async unvalidateQuote(request: RequestWithUser, id: string): Promise<QuotePrivateDto> {
		if (request.user.role != Role.Admin) {
			throw new UnauthorizedException(`user is not admin`);
		}
		const toValidate = await this.getQuoteEntity(id);
		toValidate.validated = false;
		return new QuotePrivateDto(await this.quoteRepository.save(toValidate));
	}
}