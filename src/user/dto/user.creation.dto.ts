import { IsNotEmpty } from 'class-validator';

export class UserCreationDto {
	@IsNotEmpty()
	username!: string;

	@IsNotEmpty()
	email!: string;

	@IsNotEmpty()
	password!: string;
}
