import { VersioningType, ClassSerializerInterceptor, INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as morgan from 'morgan';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
	const app: INestApplication = await NestFactory.create(AppModule, {
		logger: ['log', 'error', 'warn'],
	});

	app.enableVersioning({
		type: VersioningType.URI,
	});

	app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
	app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
	app.use(morgan('tiny'));
	app.enableCors();

	const options = new DocumentBuilder()
		.setTitle('Beauf.net')
		.setDescription("Beauf.net's API documentation")
		.setVersion('1.0')
		.build();
	const document = SwaggerModule.createDocument(app, options);
	SwaggerModule.setup('swagger', app, document);

	await app.listen(5000);
}
bootstrap();
