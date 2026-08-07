import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import { startOtelIfConfigured } from './observability/otel';
import { AppModule } from './app.module';
import { PinoNestLogger } from './observability/observability.core';

async function bootstrap() {
  startOtelIfConfigured('movvo-api');
  const app = await NestFactory.create(AppModule, {
    logger: new PinoNestLogger(),
  });
  app.use(compression());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  const origins = (
    process.env.CORS_ORIGINS ||
    (process.env.NODE_ENV === 'production'
      ? 'https://movvoerp.com.br,https://www.movvoerp.com.br,https://athena-gym.vercel.app'
      : 'http://localhost:3000')
  )
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins, credentials: true });
  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('Movvo ERP API')
    .setDescription(
      'PaaS official API — G-17 scale/observability. Public API under /api/v1/public.',
    )
    .setVersion('0.14.0')
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
  console.log(`Movvo API listening on http://${host}:${port}/api/v1`);
}

bootstrap();
