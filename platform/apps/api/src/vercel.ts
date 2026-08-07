import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import express, { type Request, type Response } from 'express';
import { AppModule } from './app.module';
import { PinoNestLogger } from './observability/observability.core';
import { startOtelIfConfigured } from './observability/otel';

type ExpressApp = ReturnType<typeof express>;

let cached: ExpressApp | null = null;

async function createApp(): Promise<ExpressApp> {
  startOtelIfConfigured('movvo-api');
  const server = express();
  server.use(compression());
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    logger: new PinoNestLogger(),
  });

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
    .setDescription('PaaS official API')
    .setVersion('0.13.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document);

  await app.init();
  return server;
}

export default async function handler(req: Request, res: Response) {
  if (!cached) cached = await createApp();
  return cached(req, res);
}
