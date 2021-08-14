import { QuoteEntity } from "../quote.entity";

export class QuotePublicDto {
	constructor(entity: QuoteEntity) {
		this.id = entity.id!;
		this.text = entity.text!;
		this.source = entity.source;
		this.createdAt = entity.createdAt!;
	}

	id!: string;

	text!: string;

	source?: string;

	createdAt!: string;
}