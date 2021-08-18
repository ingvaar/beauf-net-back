import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional } from 'class-validator';
import { Role } from '../../auth/roles/role.enum';

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
	role?: Role;

	@ApiPropertyOptional()
	@IsOptional()
	privateKey?: string;
}
