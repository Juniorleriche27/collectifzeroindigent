import { Injectable, UnauthorizedException } from '@nestjs/common';

import { SupabaseDataService } from '../infra/supabase-data.service';
import type { AuthUser } from './auth-user.interface';

@Injectable()
export class SupabaseAuthService {
  constructor(private readonly supabaseDataService: SupabaseDataService) {}

  async verifyAccessToken(token: string): Promise<AuthUser> {
    if (!token) {
      throw new UnauthorizedException('Missing access token.');
    }

    const client = this.supabaseDataService.forUser(token);
    const {
      data: { user },
      error,
    } = await client.auth.getUser();

    if (error || !user) {
      throw new UnauthorizedException('Invalid or expired token.');
    }

    const appMetadata =
      user.app_metadata && typeof user.app_metadata === 'object'
        ? (user.app_metadata as Record<string, unknown>)
        : {};
    const userMetadata =
      user.user_metadata && typeof user.user_metadata === 'object'
        ? (user.user_metadata as Record<string, unknown>)
        : {};
    const roleFromAppMetadata =
      typeof appMetadata.role === 'string' ? appMetadata.role : undefined;
    const roleFromUserMetadata =
      typeof userMetadata.role === 'string' ? userMetadata.role : undefined;

    return {
      email: user.email ?? undefined,
      id: user.id,
      rawUser: user as unknown as Record<string, unknown>,
      role: roleFromAppMetadata ?? roleFromUserMetadata,
      token,
    };
  }
}
