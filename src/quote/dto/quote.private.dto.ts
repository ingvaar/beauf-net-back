import { AutoMap } from "@automapper/classes";

export class QuotePrivateDto {
	@AutoMap()
	id!: string;

	@AutoMap()
	text!: string;

	@AutoMap()
	source?: string;

	@AutoMap()
	author?: string;

	@AutoMap()
	createdAt!: string;

	@AutoMap()
	updatedAt?: string;
}