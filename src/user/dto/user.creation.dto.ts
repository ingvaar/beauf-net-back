import { IsEmail, IsNotEmpty, Length, Matches } from 'class-validator';

export class UserCreationDto {
	@IsNotEmpty()
	@Matches('^\\w+$', 'i',
		{
			message: 'Should only contains letters and numbers'
		})
	@Length(4, 24,
		{
			message: 'Must be between 4 and 24 long'
		})
	username!: string;

	@IsNotEmpty()
	@IsEmail({},
		{
			message: 'Must be a valid email'
		})
	email!: string;

	@IsNotEmpty()
	@Matches('^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z])(?=.*[!@#$&\\*_\'\\-"èé`àç()[\\]?]).{0,}$', '',
		{
			message: 'Should contains atleast one special character, one uppercase and one number'
		})
	@Length(8, 32,
		{
			message: 'Must be between 8 and 32 long'
		})
	password!: string;

	@IsNotEmpty()
	captcha!: string;
}
