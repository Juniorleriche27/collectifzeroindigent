import { Module } from '@nestjs/common';

import { InfraModule } from '../infra/infra.module';
import { BirthdayController } from './birthday.controller';
import { BirthdayService } from './birthday.service';

@Module({
  controllers: [BirthdayController],
  exports: [BirthdayService],
  imports: [InfraModule],
  providers: [BirthdayService],
})
export class BirthdayModule {}
