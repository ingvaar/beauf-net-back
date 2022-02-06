import { HttpModule } from "@nestjs/axios";
import { Global, Module } from "@nestjs/common";
import { GoogleService } from "./google.service";

@Global()
@Module({
	imports: [
		HttpModule,
	],
	controllers: [],
	providers: [GoogleService],
	exports: [GoogleService],
})
export class GoogleModule { }