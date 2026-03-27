import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { InfraModule } from '../infra/infra.module';
import { SupportAiController } from './support-ai.controller';
import { SupportAiService } from './support-ai.service';

@Module({
  controllers: [SupportAiController],
  imports: [AuthModule, InfraModule],
  providers: [SupportAiService, OptionalJwtAuthGuard],
})
export class SupportAiModule {}
