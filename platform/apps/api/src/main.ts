import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  const origins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins, credentials: true });
  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('ATHENA PLATFORM API')
    .setDescription(
      'PaaS official API — Sprint 9 Open Platform. Public API under /api/v1/public (gateway alias /api/public/v1). OAuth2 at /api/v1/oauth/token.',
    )
    .setVersion('0.10.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'X-Company-Id', in: 'header' }, 'company')
    .addApiKey({ type: 'apiKey', name: 'X-Unit-Id', in: 'header' }, 'unit')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document);

  const port = Number(process.env.PORT || 3001);
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);
  // eslint-disable-next-line no-console
  console.log(`ATHENA API listening on http://${host}:${port}/api/v1`);
  // eslint-disable-next-line no-console
  console.log(`Swagger: http://${host}:${port}/api/v1/docs`);
}

bootstrap();
