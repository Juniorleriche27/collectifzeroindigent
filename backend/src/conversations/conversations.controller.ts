import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../common/types/authenticated-request';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  async list(
    @Req() request: AuthenticatedRequest,
    @Query('conversation_type') conversationType?: string,
    @Query('q') search?: string,
  ) {
    return this.conversationsService.list(request.supabaseAccessToken, {
      conversation_type: conversationType,
      q: search,
    });
  }

  @Post()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() payload: CreateConversationDto,
  ) {
    return this.conversationsService.create(
      request.supabaseAccessToken,
      payload,
    );
  }

  @Delete(':id')
  async deleteConversation(
    @Req() request: AuthenticatedRequest,
    @Param('id') conversationId: string,
  ) {
    return this.conversationsService.deleteConversation(
      request.supabaseAccessToken,
      conversationId,
    );
  }

  @Get(':id/messages')
  async listMessages(
    @Req() request: AuthenticatedRequest,
    @Param('id') conversationId: string,
    @Query('before') before?: string,
    @Query('limit') limit?: string,
  ) {
    return this.conversationsService.listMessages(
      request.supabaseAccessToken,
      conversationId,
      { before, limit },
    );
  }

  @Post(':id/messages')
  async postMessage(
    @Req() request: AuthenticatedRequest,
    @Param('id') conversationId: string,
    @Body() payload: CreateMessageDto,
  ) {
    return this.conversationsService.postMessage(
      request.supabaseAccessToken,
      conversationId,
      payload,
    );
  }

  @Patch(':id/messages/:messageId')
  async updateMessage(
    @Req() request: AuthenticatedRequest,
    @Param('id') conversationId: string,
    @Param('messageId') messageId: string,
    @Body() payload: UpdateMessageDto,
  ) {
    return this.conversationsService.updateMessage(
      request.supabaseAccessToken,
      conversationId,
      messageId,
      payload,
    );
  }

  @Post(':id/messages/:messageId/likes/toggle')
  async toggleMessageLike(
    @Req() request: AuthenticatedRequest,
    @Param('id') conversationId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.conversationsService.toggleMessageLike(
      request.supabaseAccessToken,
      conversationId,
      messageId,
    );
  }

  @Delete(':id/messages/:messageId')
  async deleteMessage(
    @Req() request: AuthenticatedRequest,
    @Param('id') conversationId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.conversationsService.deleteMessage(
      request.supabaseAccessToken,
      conversationId,
      messageId,
    );
  }
}
