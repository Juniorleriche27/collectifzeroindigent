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

import type { AuthenticatedRequest } from '../common/types/authenticated-request';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LogMemberContactActionDto } from './dto/log-member-contact-action.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { ValidateMemberDto } from './dto/validate-member.dto';
import { MembersService } from './members.service';

@Controller('members')
@UseGuards(JwtAuthGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  async list(
    @Req() request: AuthenticatedRequest,
    @Query() query: Record<string, string>,
  ) {
    return this.membersService.list(request.supabaseAccessToken, query);
  }

  @Get('me')
  async getCurrent(@Req() request: AuthenticatedRequest) {
    return this.membersService.getCurrent(request.supabaseAccessToken);
  }

  @Get(':id')
  async getById(
    @Req() request: AuthenticatedRequest,
    @Param('id') memberId: string,
  ) {
    return this.membersService.getById(request.supabaseAccessToken, memberId);
  }

  @Patch('me')
  async updateCurrent(
    @Req() request: AuthenticatedRequest,
    @Body() payload: UpdateMemberDto,
  ) {
    return this.membersService.updateCurrent(
      request.supabaseAccessToken,
      payload,
    );
  }

  @Patch(':id')
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('id') memberId: string,
    @Body() payload: UpdateMemberDto,
  ) {
    return this.membersService.update(
      request.supabaseAccessToken,
      memberId,
      payload,
    );
  }

  @Patch(':id/validation')
  async validate(
    @Req() request: AuthenticatedRequest,
    @Param('id') memberId: string,
    @Body() payload: ValidateMemberDto,
  ) {
    return this.membersService.validate(
      request.supabaseAccessToken,
      memberId,
      payload,
    );
  }

  @Post('contact-actions')
  async logContactAction(
    @Req() request: AuthenticatedRequest,
    @Body() payload: LogMemberContactActionDto,
  ) {
    return this.membersService.logContactAction(
      request.supabaseAccessToken,
      payload,
    );
  }
}
