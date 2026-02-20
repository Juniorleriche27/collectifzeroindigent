import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../common/types/authenticated-request';
import { CreateOrganisationDto } from './dto/create-organisation.dto';
import { OrganisationsService } from './organisations.service';

@Controller('organisations')
@UseGuards(JwtAuthGuard)
export class OrganisationsController {
  constructor(private readonly organisationsService: OrganisationsService) {}

  @Get()
  async list(
    @Req() request: AuthenticatedRequest,
    @Query('q') search?: string,
  ) {
    return this.organisationsService.list(request.supabaseAccessToken, search);
  }

  @Post()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() payload: CreateOrganisationDto,
  ) {
    return this.organisationsService.create(
      request.supabaseAccessToken,
      payload,
    );
  }
}
