import { MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UserEntity } from "../../user/user.entity";

@Injectable()
export class MailService {
	constructor(
		private readonly mailerService: MailerService,
		private readonly configService: ConfigService,
		) { }

	public async sendEmailConfirmation(user: UserEntity, token: string) {
		const url = `${this.configService.get<string>("BASE_URL")}/confirm?token=${token}`;

		await this.mailerService.sendMail({
			to: user.email,
			subject: 'Welcome to Beauf.net! Confirm your Email',
			template: 'confirmation',
			context: {
				name: user.username,
				url,
			},
		}).catch((reason: any) => {
			throw new Error(`Cannot send mail: ${reason.message}`);
		});
	}
}