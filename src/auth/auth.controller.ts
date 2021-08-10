import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Public } from './auth.decorator';
import { AuthService } from './auth.service';
import { UserLoginDto } from './dto/user.login.dto';

@ApiTags('auth')
@Controller()
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Public()
	@Post('login')
	async login(@Body() user: UserLoginDto): Promise<{ token: string }> {
		return {
			token: await this.authService.login(user),
		};
	}
}
