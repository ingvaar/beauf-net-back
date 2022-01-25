import { IsNotEmpty, IsOptional } from "class-validator";

export class QuoteCreationDto {
	@IsNotEmpty()
	text!: string;

	@IsOptional()
	source?: string;

	@IsOptional()
	author?: string;

	@IsNotEmpty()
	captcha!: string;
}