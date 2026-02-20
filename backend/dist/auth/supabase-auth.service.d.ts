import { SupabaseDataService } from '../infra/supabase-data.service';
import type { AuthUser } from './auth-user.interface';
export declare class SupabaseAuthService {
    private readonly supabaseDataService;
    constructor(supabaseDataService: SupabaseDataService);
    verifyAccessToken(token: string): Promise<AuthUser>;
}
