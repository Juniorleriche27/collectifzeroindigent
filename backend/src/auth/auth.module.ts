import { Module } from '@nestjs/common';

import { InfraModule } from '../infra/infra.module';
import { SupabaseAuthService } from './supabase-auth.service';

@Module({
  imports: [InfraModule],
  exports: [SupabaseAuthService],
  providers: [SupabaseAuthService],
})
export class AuthModule {}
