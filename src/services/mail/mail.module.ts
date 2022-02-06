import { MailerModule } from "@nestjs-modules/mailer";
import { Global, Module } from "@nestjs/common";
import { join } from "path";
import { MailService } from "./mail.service";
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigModule, ConfigService } from "@nestjs/config";

@Global()
@Module({
	imports: [
		MailerModule.forRootAsync({
      		useFactory: async (config: ConfigService) => ({
				transport: {
					host: config.get<string>('MAIL_HOST'),
					port: config.get<number>('MAIL_PORT'),
					auth: {
						user: config.get<string>('MAIL_USER'),
						pass: config.get<string>('MAIL_PASS'),
					},
				},
				defaults: {
					from: `"No Reply" <noreply@beauf.net>`,
				},
				template: {
					dir: join(__dirname, 'templates'),
					adapter: new HandlebarsAdapter(),
					options: {
						strict: true,
					},
				},
			}),
			inject: [ConfigService],
		}),
		ConfigModule,
	],
	providers: [MailService],
	exports: [MailService],
})
export class MailModule { }