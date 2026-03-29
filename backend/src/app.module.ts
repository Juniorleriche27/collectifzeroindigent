import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from './auth/auth.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { BirthdayModule } from './birthday/birthday.module';
import { ConversationsModule } from './conversations/conversations.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DonationsModule } from './donations/donations.module';
import { EmailCampaignsModule } from './email-campaigns/email-campaigns.module';
import { HealthModule } from './health/health.module';
import { InfraModule } from './infra/infra.module';
import { LocationsModule } from './locations/locations.module';
import { MembersModule } from './members/members.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { OrganisationsModule } from './organisations/organisations.module';
import { PaymentsModule } from './payments/payments.module';
import { SupportAiModule } from './support-ai/support-ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.local', '../.env.local'],
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    InfraModule,
    AuthModule,
    AnnouncementsModule,
    BirthdayModule,
    ConversationsModule,
    HealthModule,
    DashboardModule,
    DonationsModule,
    EmailCampaignsModule,
    LocationsModule,
    MembersModule,
    OnboardingModule,
    OrganisationsModule,
    PaymentsModule,
    SupportAiModule,
  ],
})
export class AppModule {}
