import { Controller, Get, Post, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BirthdayService } from './birthday.service';

@Controller('birthday')
@UseGuards(JwtAuthGuard)
export class BirthdayController {
  constructor(private readonly birthdayService: BirthdayService) {}

  @Get('today')
  async listToday() {
    const members = await this.birthdayService.listTodayBirthdays();
    return { count: members.length, items: members };
  }

  @Post('send-today')
  async sendToday() {
    const result = await this.birthdayService.triggerTodaySend();
    return { message: `${result.sent} email(s) envoyé(s), ${result.failed} échec(s).`, ...result };
  }
}
