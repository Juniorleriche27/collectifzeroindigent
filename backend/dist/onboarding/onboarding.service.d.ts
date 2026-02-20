import { SupabaseDataService } from '../infra/supabase-data.service';
import { CreateOnboardingDto } from './dto/create-onboarding.dto';
export declare class OnboardingService {
    private readonly supabaseDataService;
    constructor(supabaseDataService: SupabaseDataService);
    create(accessToken: string, payload: CreateOnboardingDto): Promise<{
        member_id: string;
        message: string;
    }>;
}
