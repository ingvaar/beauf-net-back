export class CaptchaResponseDto {
	success!: boolean;
	challengeTS!: string;
	hostname!: string;
	errorCodes?: string[];
};