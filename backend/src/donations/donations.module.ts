import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { InfraModule } from '../infra/infra.module';
import { DonationsController } from './donations.controller';
import { DonationsService } from './donations.service';

@Module({
  controllers: [DonationsController],
  imports: [AuthModule, InfraModule],
  providers: [DonationsService],
})
export class DonationsModule {}
