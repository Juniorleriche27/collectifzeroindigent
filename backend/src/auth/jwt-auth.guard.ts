import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import type { AuthenticatedRequest } from '../common/types/authenticated-request';
import { SupabaseAuthService } from './supabase-auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly supabaseAuthService: SupabaseAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const accessToken = this.extractBearerToken(request.headers.authorization);

    request.supabaseAccessToken = accessToken;
    request.user =
      await this.supabaseAuthService.verifyAccessToken(accessToken);
    return true;
  }

  private extractBearerToken(authorizationHeader?: string): string {
    if (!authorizationHeader?.toLowerCase().startsWith('bearer ')) {
      throw new UnauthorizedException(
        'Authorization Bearer token is required.',
      );
    }
    const token = authorizationHeader.slice('bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedException('Bearer token is empty.');
    }
    return token;
  }
}
