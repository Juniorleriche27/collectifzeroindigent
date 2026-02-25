import { ConfigService } from '@nestjs/config';
import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';

import { SupabaseDataService } from '../infra/supabase-data.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseDataService: SupabaseDataService,
  ) {}

  @Get()
  getHealth() {
    return {
      environment: this.configService.get<string>('NODE_ENV') ?? 'unknown',
      service: 'czi-backend',
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor(process.uptime()),
      version: process.env.npm_package_version ?? 'unknown',
    };
  }

  @Get('ready')
  async getReadiness(@Res() response: Response) {
    const checks = {
      env: {
        has_supabase_anon_key: this.hasEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
        has_supabase_service_role_key: this.hasEnv('SUPABASE_SERVICE_ROLE_KEY'),
        has_supabase_url: this.hasEnv('NEXT_PUBLIC_SUPABASE_URL'),
      },
      supabase: {
        can_query_member: false,
        error: null as string | null,
      },
    };

    if (
      checks.env.has_supabase_url &&
      checks.env.has_supabase_anon_key &&
      checks.env.has_supabase_service_role_key
    ) {
      try {
        const adminClient = this.supabaseDataService.admin();
        const { error } = await adminClient
          .from('member')
          .select('id', { count: 'exact', head: true })
          .limit(1);

        if (error) {
          checks.supabase.error = error.message;
        } else {
          checks.supabase.can_query_member = true;
        }
      } catch (error) {
        checks.supabase.error =
          error instanceof Error ? error.message : 'Unknown readiness error';
      }
    } else {
      checks.supabase.error = 'Missing required Supabase env vars';
    }

    const ready = checks.supabase.can_query_member;
    const payload = {
      checks,
      environment: this.configService.get<string>('NODE_ENV') ?? 'unknown',
      service: 'czi-backend',
      status: ready ? 'ready' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor(process.uptime()),
      version: process.env.npm_package_version ?? 'unknown',
    };

    return response.status(ready ? 200 : 503).json(payload);
  }

  private hasEnv(name: string): boolean {
    const value = this.configService.get<string>(name)?.trim() ?? '';
    return value.length > 0;
  }
}
