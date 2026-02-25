import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

import { AppModule } from './app.module';

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
  await app.listen(process.env.BACKEND_PORT ?? process.env.PORT ?? 4000);
}
void bootstrap();
