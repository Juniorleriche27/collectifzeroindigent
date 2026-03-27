import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import type { AuthenticatedRequest } from '../common/types/authenticated-request';
import { SupabaseAuthService } from './supabase-auth.service';

/**
 * Like JwtAuthGuard but never throws — anonymous requests are allowed.
 * Sets supabaseAccessToken to null when no valid token is provided.
 */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly supabaseAuthService: SupabaseAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization ?? '';

    if (!authHeader.toLowerCase().startsWith('bearer ')) {
      request.supabaseAccessToken = null as unknown as string;
      return true;
    }

    const token = authHeader.slice('bearer '.length).trim();
    if (!token) {
      request.supabaseAccessToken = null as unknown as string;
      return true;
    }

    try {
      request.user = await this.supabaseAuthService.verifyAccessToken(token);
      request.supabaseAccessToken = token;
    } catch {
      request.supabaseAccessToken = null as unknown as string;
    }

    return true;
  }
}
