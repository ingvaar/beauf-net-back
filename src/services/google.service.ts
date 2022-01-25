import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { lastValueFrom, map, retry } from "rxjs";
import { CaptchaResponseDto } from "./dto/google.captcha.response.dto";

@Injectable()
export class GoogleService {
	private captchaSecret: string = process.env.CAPTCHA_SECRET_KEY || ""

	constructor(private httpService: HttpService) { }

	public async verifyCaptcha(token: string): Promise<boolean> {
		const response: CaptchaResponseDto = await lastValueFrom(this.httpService.post(
			`https://www.google.com/recaptcha/api/siteverify?secret=${this.captchaSecret}&response=${token}`,
			{},
			).pipe(
				retry(3),
				map(response => response.data),
			));

		return response.success;
	}
}