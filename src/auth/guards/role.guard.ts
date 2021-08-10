import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExtractJwt } from 'passport-jwt';

import { AuthService } from '../auth.service';
import { ROLES_KEY } from '../roles/role.decorator';
import { Role } from '../roles/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private reflector: Reflector, private authService: AuthService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
			context.getHandler(),
			context.getClass(),
		]);
		if (!requiredRoles) {
			return true;
		}
		const tokenExtractor = ExtractJwt.fromAuthHeaderAsBearerToken();
		const token = tokenExtractor(context.switchToHttp().getRequest());
		if (!token) {
			throw new UnauthorizedException('bad token');
		}
		const user = await this.authService.userFromToken(token);
		return requiredRoles.some((role) => user.role == role);
	}
}
