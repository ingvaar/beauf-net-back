import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserModule } from "../user/user.module";
import { QuoteController } from "./quote.controller";
import { QuoteEntity } from "./quote.entity";
import { QuoteService } from "./quote.service";

@Module({
	imports: [
		TypeOrmModule.forFeature([QuoteEntity]),
		UserModule,
	],
	controllers: [QuoteController],
	providers: [QuoteService]
})
export class QuoteModule { }