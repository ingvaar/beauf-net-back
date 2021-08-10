import { IsNotEmpty } from 'class-validator';

export class UserLoginDto {
	@IsNotEmpty()
	identifier!: string;

	@IsNotEmpty()
	password!: string;
}
