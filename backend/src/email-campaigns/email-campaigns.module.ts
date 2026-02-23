import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { InfraModule } from '../infra/infra.module';
import { EmailCampaignsController } from './email-campaigns.controller';
import { EmailCampaignsService } from './email-campaigns.service';

@Module({
  controllers: [EmailCampaignsController],
  imports: [AuthModule, InfraModule],
  providers: [EmailCampaignsService],
})
export class EmailCampaignsModule {}
