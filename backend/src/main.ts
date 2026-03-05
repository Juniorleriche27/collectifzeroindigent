import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

import { AppModule } from './app.module';

function parsePort(raw: string | undefined): number | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    return null;
  }
  return parsed;
}

async function bootstrap() {
  const logger = new Logger('HTTP');
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    credentials: true,
    origin: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
  app.use((request: Request, response: Response, next: NextFunction) => {
    const startedAt = process.hrtime.bigint();
    const requestIdHeader = request.header('x-request-id')?.trim();
    const requestId = requestIdHeader || randomUUID();

    response.setHeader('x-request-id', requestId);
    response.on('finish', () => {
      const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      const logPayload = [
        `request_id=${requestId}`,
        `method=${request.method}`,
        `path=${request.originalUrl || request.url}`,
        `status=${response.statusCode}`,
        `duration_ms=${elapsedMs.toFixed(1)}`,
        `ip=${request.ip || '-'}`,
      ].join(' ');

      if (response.statusCode >= 500) {
        logger.error(logPayload);
      } else if (response.statusCode >= 400) {
        logger.warn(logPayload);
      } else {
        logger.log(logPayload);
      }
    });

    next();
  });

  const renderPort = parsePort(process.env.PORT);
  const backendPort = parsePort(process.env.BACKEND_PORT);
  if (process.env.BACKEND_PORT && !backendPort) {
    logger.warn(
      `BACKEND_PORT invalide ('${process.env.BACKEND_PORT}'). PORT Render sera utilise.`,
    );
  }

  const port = renderPort ?? backendPort ?? 4000;
  await app.listen(port, '0.0.0.0');
}
void bootstrap();
