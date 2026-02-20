import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { InfraModule } from '../infra/infra.module';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';

@Module({
  controllers: [LocationsController],
  imports: [InfraModule, AuthModule],
  providers: [LocationsService],
})
export class LocationsModule {}
