import { AutoMap } from "@automapper/classes";

export class QuotePublicDto {
	@AutoMap()
	id!: string;

	@AutoMap()
	text!: string;

	@AutoMap()
	source?: string;

	@AutoMap()
	createdAt!: string;
}