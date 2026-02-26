import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('HealthController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  it('/api/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect((response) => {
        const body = response.body as { service?: string; status?: string };
        expect(body.status).toBe('ok');
        expect(body.service).toBe('czi-backend');
      });
  });

  it('/api/health/ready (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health/ready')
      .expect((response) => {
        expect([200, 503]).toContain(response.status);
        const body = response.body as {
          checks?: { env?: unknown; supabase?: unknown };
          service?: string;
          status?: string;
        };
        expect(body.service).toBe('czi-backend');
        expect(['ready', 'degraded']).toContain(body.status ?? '');
        expect(body.checks?.env).toBeDefined();
        expect(body.checks?.supabase).toBeDefined();
      });
  });
});
