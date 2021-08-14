import { QuoteEntity } from "../quote.entity";

export class QuotePrivateDto {
	constructor(entity: QuoteEntity) {
		this.id = entity.id!;
		this.text = entity.text!;
		this.source = entity.source;
		this.author = entity.author;
		this.createdAt = entity.createdAt!;
		this.updatedAt = entity.updatedAt!
	}

	id!: string;

	text!: string;

	source?: string;

	author?: string;

	createdAt!: string;

	updatedAt?: string;
}