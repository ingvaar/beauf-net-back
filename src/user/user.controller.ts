import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';

import { Public } from '../auth/auth.decorator';
import { ParseObjectIDPipe } from '../common/objectID.pipe';
import { UserCreationDto } from './dto/user.creation.dto';
import { UserPatchDto } from './dto/user.patch.dto';
import { UserPrivateDto } from './dto/user.private.dto';
import { UserPublicDto } from './dto/user.public.dto';
import { UserService } from './user.service';
import { RequestWithUser } from './user.utils';

@ApiTags('users')
@Controller('users')
export class UserController {
	constructor(private readonly userService: UserService) { }

	@Public()
	@Get()
	@ApiParam({ name: 'perPage', required: false })
	@ApiParam({ name: 'page', required: false })
	getUsers(
		@Query('perPage') perPage: number,
		@Query('page') page: number,
	): Promise<{ page: number; perPage: number; total: number; data: UserPublicDto[] }> {
		return this.userService.getUsers(page, perPage);
	};

	@Post('resend')
	resend(
		@Req() request: RequestWithUser,
	): Promise<UserPublicDto> {
		return this.userService.resend(request);
	};

	@Public()
	@Post('confirm')
	@ApiParam({ name: 'token', required: true })
	confirm(
		@Query('token') token: string,
	): Promise<UserPublicDto> {
		return this.userService.confirm(token);
	};

	@Get(':id')
	getUser(
		@Req() request: RequestWithUser,
		@Param('id', new ParseObjectIDPipe()) id: string,
	): Promise<UserPublicDto | UserPrivateDto> {
		return this.userService.getUser(id, request);
	};

	@Public()
	@Post()
	postUser(
		@Body() createUser: UserCreationDto
	): Promise<UserPrivateDto> {
		return this.userService.saveUser(createUser);
	};

	@Patch(':id')
	patchUser(
		@Req() request: RequestWithUser,
		@Body() toPatch: UserPatchDto,
		@Param('id', new ParseObjectIDPipe()) id: string,
	): Promise<UserPrivateDto> {
		return this.userService.patchUser(request, id, toPatch);
	};

	@Delete(':id')
	deleteUser(
		@Req() request: RequestWithUser,
		@Param('id', new ParseObjectIDPipe()) id: string,
	) {
		return this.userService.deleteUser(request, id);
	};
}
