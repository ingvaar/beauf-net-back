import { IsNotEmpty } from "class-validator";

export class QuoteCreationDto {
	@IsNotEmpty()
	text!: string;

	source?: string;

	author?: string;
}