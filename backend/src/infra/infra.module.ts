import { Module } from '@nestjs/common';

import { SupabaseDataService } from './supabase-data.service';

@Module({
  exports: [SupabaseDataService],
  providers: [SupabaseDataService],
})
export class InfraModule {}
