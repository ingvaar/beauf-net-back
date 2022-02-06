import { MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";
import { UserEntity } from "../../user/user.entity";

@Injectable()
export class MailService {
	constructor(
		private readonly mailerService: MailerService,
		) { }

	public async sendEmailConfirmation(user: UserEntity, token: string) {
		const url = `https://beauf.net/confirm?token=${token}`;

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