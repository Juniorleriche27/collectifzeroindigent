import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { InfraModule } from '../infra/infra.module';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';

@Module({
  controllers: [OnboardingController],
  imports: [AuthModule, InfraModule],
  providers: [OnboardingService],
})
export class OnboardingModule {}
