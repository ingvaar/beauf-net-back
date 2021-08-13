import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';

import { Public } from '../auth/auth.decorator';
import { ParseObjectIDPipe } from '../common/objectID.pipe';
import { UserCreationDto } from './dto/user.creation.dto';
import { UserPatchDto } from './dto/user.patch.dto';
import { UserPublicDto } from './dto/user.public.dto';
import { UserEntity } from './user.entity';
import { UserService } from './user.service';
import { RequestWithUser } from './user.utils';

@ApiTags('users')
@Controller('users')
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Get()
	@ApiParam({ name: 'perPage', required: false })
	@ApiParam({ name: 'page', required: false })
	getUsers(
		@Query('perPage') perPage: number,
		@Query('page') page: number,
	): Promise<{ page: number; perPage: number; total: number; users: UserPublicDto[] }> {
		return this.userService.getUsers(page, perPage);
	}

	@Get(':id')
	getUser(
		@Req() request: RequestWithUser,
		@Param('id', new ParseObjectIDPipe()) id: string,
	): Promise<UserPublicDto | undefined> {
		return this.userService.getUser(id, request);
	}

	@Post()
	postUser(
		@Req() request: RequestWithUser,
		@Body() createUser: UserCreationDto
		): Promise<UserEntity> {
		return this.userService.saveUser(createUser, request);
	}

	@Patch(':id')
	patchUser(
		@Req() request: RequestWithUser,
		@Body() toPatch: UserPatchDto,
		@Param('id', new ParseObjectIDPipe()) id: string,
	): Promise<UserEntity> {
		return this.userService.patchUser(request, id, toPatch);
	}

	@Delete(':id')
	deleteUser(
		@Req() request: RequestWithUser,
		@Param('id', new ParseObjectIDPipe()) id: string,
	): Promise<{ deleted: number }> {
		return this.userService.deleteUser(request, id);
	}
}
