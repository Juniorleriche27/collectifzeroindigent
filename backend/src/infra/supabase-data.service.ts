import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from './database.types';

type SupabaseLikeClient = SupabaseClient<Database>;

@Injectable()
export class SupabaseDataService {
  constructor(private readonly configService: ConfigService) {}

  forUser(accessToken: string): SupabaseLikeClient {
    return createClient<Database>(this.supabaseUrl, this.supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });
  }

  admin(): SupabaseLikeClient {
    const serviceRoleKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );
    if (!serviceRoleKey) {
      throw new InternalServerErrorException(
        'Missing SUPABASE_SERVICE_ROLE_KEY.',
      );
    }
    return createClient<Database>(this.supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  private get supabaseUrl(): string {
    const value = this.configService.get<string>('NEXT_PUBLIC_SUPABASE_URL');
    if (!value) {
      throw new InternalServerErrorException(
        'Missing NEXT_PUBLIC_SUPABASE_URL.',
      );
    }
    return value;
  }

  private get supabaseAnonKey(): string {
    const value = this.configService.get<string>(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    );
    if (!value) {
      throw new InternalServerErrorException(
        'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY.',
      );
    }
    return value;
  }
}
