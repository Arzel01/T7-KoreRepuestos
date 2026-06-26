import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import helmet from 'helmet';

import { AppModule } from '../apps/backend/src/app.module';

import type { NestExpressApplication } from '@nestjs/platform-express';

const expressApp = express();
let isInitialized = false;

async function bootstrap() {
  if (isInitialized) return;

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(expressApp),
    { logger: ['error', 'warn', 'log'] },
  );

  const config = app.get(ConfigService);
  const apiPrefix = config.get<string>('API_PREFIX', 'api/v1');
  const corsOrigins = (config.get<string>('CORS_ORIGINS') ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.setGlobalPrefix(apiPrefix);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.enableCors({ origin: corsOrigins.length ? corsOrigins : true, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.init();
  isInitialized = true;
}

export default async function handler(req: express.Request, res: express.Response) {
  await bootstrap();
  expressApp(req, res);
}
