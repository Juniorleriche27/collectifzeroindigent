import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { InfraModule } from '../infra/infra.module';
import { PaydunyaController } from './paydunya.controller';
import { PaydunyaService } from './paydunya.service';

@Module({
  controllers: [PaydunyaController],
  imports: [AuthModule, InfraModule],
  providers: [PaydunyaService],
})
export class PaymentsModule {}
