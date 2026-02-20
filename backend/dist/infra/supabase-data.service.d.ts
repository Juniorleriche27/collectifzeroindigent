import { ConfigService } from '@nestjs/config';
import { type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
type SupabaseLikeClient = SupabaseClient<Database>;
export declare class SupabaseDataService {
    private readonly configService;
    constructor(configService: ConfigService);
    forUser(accessToken: string): SupabaseLikeClient;
    admin(): SupabaseLikeClient;
    private get supabaseUrl();
    private get supabaseAnonKey();
}
export {};
