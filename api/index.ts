import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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

  if (config.get<string>('SWAGGER_ENABLED', 'true') === 'true') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Kore Repuestos API')
      .setDescription('Gestión de repuestos automotrices y planes de mantenimiento')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    const swaggerPath = config.get<string>('SWAGGER_PATH', 'docs');

    // Register BEFORE app.init() so these routes sit ahead of NestJS's router
    // in the Express middleware chain. NestJS does not call next() for unmatched
    // routes, so anything registered after app.init() is never reached.
    expressApp.get(`/${swaggerPath}-json`, (_req, res) => res.json(document));
    expressApp.get(`/${swaggerPath}`, (_req, res) => {
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: blob:; worker-src blob:;",
      );
      res.send(`<!DOCTYPE html>
<html>
  <head>
    <title>Kore Repuestos API</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
    <script>
      window.onload = function() {
        window.ui = SwaggerUIBundle({
          url: '/${swaggerPath}-json',
          dom_id: '#swagger-ui',
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
          layout: 'StandaloneLayout',
          persistAuthorization: true,
        });
      };
    </script>
  </body>
</html>`);
    });
  }

  await app.init();

  isInitialized = true;
}

export default async function handler(req: express.Request, res: express.Response) {
  await bootstrap();
  expressApp(req, res);
}
