import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { InfraModule } from '../infra/infra.module';
import { OrganisationsController } from './organisations.controller';
import { OrganisationsService } from './organisations.service';

@Module({
  controllers: [OrganisationsController],
  imports: [AuthModule, InfraModule],
  providers: [OrganisationsService],
})
export class OrganisationsModule {}
