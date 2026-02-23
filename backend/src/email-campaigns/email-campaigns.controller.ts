import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../common/types/authenticated-request';
import { CreateEmailCampaignDto } from './dto/create-email-campaign.dto';
import { UpdateEmailCampaignDto } from './dto/update-email-campaign.dto';
import { EmailCampaignsService } from './email-campaigns.service';

@Controller('email-campaigns')
@UseGuards(JwtAuthGuard)
export class EmailCampaignsController {
  constructor(private readonly emailCampaignsService: EmailCampaignsService) {}

  @Get()
  async list(@Req() request: AuthenticatedRequest, @Query('q') search?: string) {
    return this.emailCampaignsService.list(request.supabaseAccessToken, search);
  }

  @Get(':id')
  async getById(@Req() request: AuthenticatedRequest, @Param('id') campaignId: string) {
    return this.emailCampaignsService.getById(request.supabaseAccessToken, campaignId);
  }

  @Post()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() payload: CreateEmailCampaignDto,
  ) {
    return this.emailCampaignsService.create(request.supabaseAccessToken, payload);
  }

  @Patch(':id')
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('id') campaignId: string,
    @Body() payload: UpdateEmailCampaignDto,
  ) {
    return this.emailCampaignsService.update(
      request.supabaseAccessToken,
      campaignId,
      payload,
    );
  }

  @Post(':id/queue')
  async queue(
    @Req() request: AuthenticatedRequest,
    @Param('id') campaignId: string,
  ) {
    return this.emailCampaignsService.queue(request.supabaseAccessToken, campaignId);
  }

  @Post(':id/send')
  async send(
    @Req() request: AuthenticatedRequest,
    @Param('id') campaignId: string,
  ) {
    return this.emailCampaignsService.markSent(
      request.supabaseAccessToken,
      campaignId,
    );
  }
}
