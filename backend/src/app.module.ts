import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthModule } from './health/health.module';
import { InfraModule } from './infra/infra.module';
import { LocationsModule } from './locations/locations.module';
import { MembersModule } from './members/members.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { OrganisationsModule } from './organisations/organisations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.local', '../.env.local'],
      isGlobal: true,
    }),
    InfraModule,
    AuthModule,
    HealthModule,
    DashboardModule,
    LocationsModule,
    MembersModule,
    OnboardingModule,
    OrganisationsModule,
  ],
})
export class AppModule {}
