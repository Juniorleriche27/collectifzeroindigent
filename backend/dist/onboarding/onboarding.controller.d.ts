import type { AuthenticatedRequest } from '../common/types/authenticated-request';
import { CreateOnboardingDto } from './dto/create-onboarding.dto';
import { OnboardingService } from './onboarding.service';
export declare class OnboardingController {
    private readonly onboardingService;
    constructor(onboardingService: OnboardingService);
    create(request: AuthenticatedRequest, payload: CreateOnboardingDto): Promise<{
        member_id: string;
        message: string;
    }>;
}
