import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt/dist/jwt.service';
import * as bcrypt from 'bcrypt';

import { UserEntity } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { UserLoginDto } from './dto/user.login.dto';

@Injectable()
export class AuthService {
	constructor(
		private userService: UserService,
		private jwtService: JwtService
	) { }

	public async validateUser(identifier: string, pass: string): Promise<UserEntity> {
		let user = undefined;
		try {
			user = await this.userService.getUserByUsername(identifier);
		} catch { }

		if (!user) {
			try {
				user = await this.userService.getUserByEmail(identifier);
			} catch { }
		}

		if (!user) {
			throw new BadRequestException('Invalid identifier or password');
		}

		if (!(await bcrypt.compare(pass, user.password || ''))) {
			throw new BadRequestException('Invalid identifier or password');
		}

		return user;
	}

	public async login(user: UserLoginDto): Promise<string> {
		const validatedUser = await this.validateUser(user.identifier, user.password);
		const payload = { userID: validatedUser.id, role: validatedUser.role };
		return this.jwtService.sign(payload);
	}

	async userFromToken(payload: string): Promise<UserEntity> {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const decodedToken: any = this.jwtService.decode(payload);
		if (!decodedToken || !decodedToken.userID) {
			throw new UnauthorizedException();
		}
		try {
			return await this.userService.getUser(decodedToken.userID);
		} catch {
			throw new UnauthorizedException('Invalid Token');
		}
	}
}
