import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../common/types/authenticated-request';
import { ConfirmPaydunyaTokenDto } from './dto/confirm-paydunya-token.dto';
import { CreatePaydunyaCheckoutDto } from './dto/create-paydunya-checkout.dto';
import { PaydunyaService } from './paydunya.service';

@Controller('payments/paydunya')
export class PaydunyaController {
  constructor(private readonly paydunyaService: PaydunyaService) {}

  @UseGuards(JwtAuthGuard)
  @Post('donations/:id/checkout')
  async createDonationCheckout(
    @Req() request: AuthenticatedRequest,
    @Param('id') donationId: string,
    @Body() payload: CreatePaydunyaCheckoutDto,
  ) {
    return this.paydunyaService.createDonationCheckout(
      request.supabaseAccessToken,
      donationId,
      payload,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('member-card-requests/:id/checkout')
  async createMemberCardRequestCheckout(
    @Req() request: AuthenticatedRequest,
    @Param('id') cardRequestId: string,
    @Body() payload: CreatePaydunyaCheckoutDto,
  ) {
    return this.paydunyaService.createMemberCardRequestCheckout(
      request.supabaseAccessToken,
      cardRequestId,
      payload,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('confirm')
  async confirmAndSync(@Body() payload: ConfirmPaydunyaTokenDto) {
    const result = await this.paydunyaService.confirmAndSyncByToken(
      payload.token,
    );
    return {
      message: 'Statut paiement synchronise depuis PayDunya.',
      ...result,
    };
  }

  @Post('ipn')
  async ipn(@Body() payload: unknown) {
    return this.paydunyaService.handleIpn(payload);
  }
}
