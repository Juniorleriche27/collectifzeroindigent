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
import { AskSupportAiDto } from './dto/ask-support-ai.dto';
import { SupportAiService } from './support-ai.service';

@Controller('support-ai')
@UseGuards(JwtAuthGuard)
export class SupportAiController {
  constructor(private readonly supportAiService: SupportAiService) {}

  @Get('history')
  async history(
    @Req() request: AuthenticatedRequest,
    @Query('limit') limitRaw?: string,
  ) {
    const parsedLimit = Number.parseInt(limitRaw ?? '', 10);
    const limit = Number.isFinite(parsedLimit) ? parsedLimit : undefined;
    return this.supportAiService.history(request.supabaseAccessToken, limit);
  }

  @Post('ask')
  async ask(
    @Req() request: AuthenticatedRequest,
    @Body() payload: AskSupportAiDto,
  ) {
    return this.supportAiService.ask(request.supabaseAccessToken, payload);
  }
}
