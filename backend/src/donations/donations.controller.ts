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
import { CreateDonationDto } from './dto/create-donation.dto';
import { UpdateDonationDto } from './dto/update-donation.dto';
import { DonationsService } from './donations.service';

@Controller('donations')
@UseGuards(JwtAuthGuard)
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Get()
  async list(
    @Req() request: AuthenticatedRequest,
    @Query('q') search?: string,
    @Query('status') status?: string,
  ) {
    return this.donationsService.list(request.supabaseAccessToken, {
      q: search,
      status,
    });
  }

  @Post()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() payload: CreateDonationDto,
  ) {
    return this.donationsService.create(request.supabaseAccessToken, payload);
  }

  @Patch(':id')
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('id') donationId: string,
    @Body() payload: UpdateDonationDto,
  ) {
    return this.donationsService.update(
      request.supabaseAccessToken,
      donationId,
      payload,
    );
  }
}
