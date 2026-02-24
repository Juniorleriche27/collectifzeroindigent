import {
  Body,
  Controller,
  Delete,
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
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Controller('announcements')
@UseGuards(JwtAuthGuard)
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  async list(
    @Req() request: AuthenticatedRequest,
    @Query('q') search?: string,
  ) {
    return this.announcementsService.list(request.supabaseAccessToken, search);
  }

  @Get(':id')
  async getById(
    @Req() request: AuthenticatedRequest,
    @Param('id') announcementId: string,
  ) {
    return this.announcementsService.getById(
      request.supabaseAccessToken,
      announcementId,
    );
  }

  @Post()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() payload: CreateAnnouncementDto,
  ) {
    return this.announcementsService.create(
      request.supabaseAccessToken,
      payload,
    );
  }

  @Patch(':id')
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('id') announcementId: string,
    @Body() payload: UpdateAnnouncementDto,
  ) {
    return this.announcementsService.update(
      request.supabaseAccessToken,
      announcementId,
      payload,
    );
  }

  @Delete(':id')
  async remove(
    @Req() request: AuthenticatedRequest,
    @Param('id') announcementId: string,
  ) {
    return this.announcementsService.remove(
      request.supabaseAccessToken,
      announcementId,
    );
  }
}
