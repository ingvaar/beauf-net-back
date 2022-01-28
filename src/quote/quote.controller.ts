import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import { ApiParam, ApiTags } from "@nestjs/swagger";
import { Public } from "../auth/auth.decorator";
import { ParseObjectIDPipe } from "../common/objectID.pipe";
import { RequestWithUser } from "../user/user.utils";
import { QuoteCreationDto } from "./dto/quote.creation.dto";
import { QuotePatchDto } from "./dto/quote.patch.dto";
import { QuotePrivateDto } from "./dto/quote.private.dto";
import { QuotePublicDto } from "./dto/quote.public.dto";
import { QuoteService } from "./quote.service";

@ApiTags('quotes')
@Controller('quotes')
export class QuoteController {
	constructor(private readonly quoteService: QuoteService) {}

	@Get()
	@Public()
	@ApiParam({name: 'perPage', required: false})
	@ApiParam({name: 'page', required: false})
	public getQuotes(
		@Query('perPage') perPage: number,
		@Query('page') page: number,
	): Promise<{ page: number; perPage: number; total: number; data: Array<QuotePublicDto> }> {
		return this.quoteService.getQuotes(page, perPage);
	}

	@Get('unvalidated')
	@ApiParam({name: 'perPage', required: false})
	@ApiParam({name: 'page', required: false})
	public getUnvalidatedQuotes(
		@Req() request: RequestWithUser,
		@Query('perPage') perPage: number,
		@Query('page') page: number,
	): Promise<{ page: number; perPage: number; total: number; data: Array<QuotePrivateDto> }> {
		return this.quoteService.getUnvalidatedQuotes(request, page, perPage);
	}

	@Get(':id')
	@Public()
	public getQuote(
		@Param('id', new ParseObjectIDPipe()) id: string
	): Promise<QuotePublicDto> {
		return this.quoteService.getQuote(id);
	}

	@Get('unvalidated/:id')
	public getUnvalidatedQuote(
		@Req() request: RequestWithUser,
		@Param('id', new ParseObjectIDPipe()) id: string
	): Promise<QuotePrivateDto> {
		return this.quoteService.getPrivateQuote(request, id);
	}

	@Post()
	@Public()
	public postQuote(
		@Body() newQuote: QuoteCreationDto
	): Promise<QuotePublicDto> {
		return this.quoteService.addQuote(newQuote);
	}

	@Patch(':id')
	public patchQuote(
		@Req() request: RequestWithUser,
		@Body() patchedQuote: QuotePatchDto,
		@Param('id', new ParseObjectIDPipe()) id: string,
	): Promise<QuotePrivateDto> {
		return this.quoteService.updateQuote(request, id, patchedQuote);
	}

	@Delete(':id')
	public deleteQuote(
		@Req() request: RequestWithUser,
		@Param('id', new ParseObjectIDPipe()) id: string,
	) {
		this.quoteService.deleteQuote(request, id);
	}

	@Post(':id/validate')
	public validateQuote(
		@Req() request: RequestWithUser,
		@Param('id', new ParseObjectIDPipe()) id: string,
	): Promise<QuotePrivateDto> {
		return this.quoteService.validateQuote(request, id);
	}

	@Post(':id/unvalidate')
	public unvalidateQuote(
		@Req() request: RequestWithUser,
		@Param('id', new ParseObjectIDPipe()) id: string,
	): Promise<QuotePrivateDto> {
		return this.quoteService.unvalidateQuote(request, id);
	}
}