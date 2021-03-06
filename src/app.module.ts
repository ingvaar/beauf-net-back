import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';

import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/role.guard';
import { QuoteModule } from './quote/quote.module';
import { GoogleModule } from './services/google/google.module';
import { MailModule } from './services/mail/mail.module';
import { UserModule } from './user/user.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		TypeOrmModule.forRoot({
			type: 'postgres',
			host: process.env.POSTGRES_HOST,
			port: parseInt(process.env.POSTGRES_PORT || '5432'),
			username: process.env.POSTGRES_USERNAME,
			password: process.env.POSTGRES_PASSWORD,
			database: process.env.POSTGRES_DB,
			entities: [join(__dirname, '**', '*.entity.{ts,js}')],
			synchronize: false,
			logging: false,
			migrationsRun: true,
			migrations: [join(__dirname, './migrations/{.ts,*.js}')],
		}),
		AuthModule,
		UserModule,
		QuoteModule,
		GoogleModule,
		MailModule,
	],
	providers: [
		{
			provide: APP_GUARD,
			useClass: RolesGuard,
		},
		{
			provide: APP_GUARD,
			useClass: JwtAuthGuard,
		},
	],
})
export class AppModule {}
