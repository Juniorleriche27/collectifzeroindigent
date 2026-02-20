import { CanActivate, ExecutionContext } from '@nestjs/common';
import { SupabaseAuthService } from './supabase-auth.service';
export declare class JwtAuthGuard implements CanActivate {
    private readonly supabaseAuthService;
    constructor(supabaseAuthService: SupabaseAuthService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private extractBearerToken;
}
