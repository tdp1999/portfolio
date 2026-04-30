/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { config } from 'dotenv';
config();

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app/app.module';
import { DomainExceptionFilter, InfrastructureExceptionFilter } from './infrastructure/filters/domain-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  const isProduction = process.env['NODE_ENV'] === 'production';
  if (isProduction && !process.env.CORS_ORIGINS) {
    throw new Error('CORS_ORIGINS is required in production');
  }
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
        .map((o) => o.trim())
        .filter(Boolean)
    : ['http://localhost:4200', 'http://localhost:4300'];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Helmet CSP for API-served responses (e.g. Swagger UI, error pages).
  // Frontend CSP is set via <meta> tag in index.html.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
        },
      },
    })
  );
  app.use(cookieParser());
  app.useGlobalFilters(new DomainExceptionFilter(), new InfrastructureExceptionFilter());
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
  Logger.log(`📎 FRONTEND_URL=${process.env['FRONTEND_URL'] ?? '(not set, fallback 4200)'}`);
}

bootstrap();
