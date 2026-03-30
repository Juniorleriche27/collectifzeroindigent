import { Controller, Get, Post, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BirthdayService } from './birthday.service';

@Controller('birthday')
export class BirthdayController {
  constructor(private readonly birthdayService: BirthdayService) {}

  /** Public — no auth: today's birthdays with photo + AI message for the public website */
  @Get('public')
  async publicToday() {
    const items = await this.birthdayService.getPublicBirthdays();
    return { count: items.length, items };
  }

  /** Admin only: list today's birthdays */
  @Get('today')
  @UseGuards(JwtAuthGuard)
  async listToday() {
    const members = await this.birthdayService.listTodayBirthdays();
    return { count: members.length, items: members };
  }

  /** Admin only: manually trigger birthday emails */
  @Post('send-today')
  @UseGuards(JwtAuthGuard)
  async sendToday() {
    const result = await this.birthdayService.triggerTodaySend();
    return { message: `${result.sent} email(s) envoyé(s), ${result.failed} échec(s).`, ...result };
  }
}
