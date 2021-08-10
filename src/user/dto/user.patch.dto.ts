import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional } from 'class-validator';

export class UserPatchDto {
	@ApiPropertyOptional()
	@IsOptional()
	username?: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsEmail()
	email?: string;

	@ApiPropertyOptional()
	@IsOptional()
	password?: string;

	@ApiPropertyOptional()
	@IsOptional()
	publicKey?: string;

	@ApiPropertyOptional()
	@IsOptional()
	privateKey?: string;
}
