import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';

import { SupabaseDataService } from '../infra/supabase-data.service';

type BirthdayMember = {
  birth_date: string | null;
  email: string | null;
  first_name: string | null;
  id: string;
  last_name: string | null;
};

@Injectable()
export class BirthdayService {
  private readonly logger = new Logger(BirthdayService.name);

  constructor(
    private readonly supabaseDataService: SupabaseDataService,
    private readonly configService: ConfigService,
  ) {}

  /** Runs every day at 08:00 AM */
  @Cron('0 8 * * *')
  async sendBirthdayWishes(): Promise<void> {
    this.logger.log('Birthday cron: checking today birthdays…');
    const members = await this.fetchTodayBirthdays();

    if (members.length === 0) {
      const { mm, dd } = this.todayParts();
      this.logger.log(`No active member birthdays today (${mm}-${dd})`);
      return;
    }

    this.logger.log(`Sending birthday wishes to ${members.length} member(s)`);
    let sent = 0;
    let failed = 0;

    for (const member of members) {
      if (!member.email) continue;
      try {
        await this.sendBirthdayEmail(member.email, member.first_name ?? 'cher(e) membre');
        sent++;
      } catch (err) {
        failed++;
        this.logger.warn(
          `Failed sending birthday email to ${member.email}: ${(err as Error).message}`,
        );
      }
    }

    this.logger.log(`Birthday emails: ${sent} sent, ${failed} failed`);
  }

  /** For the admin endpoint: list today's birthdays */
  async listTodayBirthdays(): Promise<BirthdayMember[]> {
    return this.fetchTodayBirthdays();
  }

  /** For the admin endpoint: manually trigger sending */
  async triggerTodaySend(): Promise<{ failed: number; sent: number; total: number }> {
    const members = await this.fetchTodayBirthdays();
    let sent = 0;
    let failed = 0;

    for (const member of members) {
      if (!member.email) continue;
      try {
        await this.sendBirthdayEmail(member.email, member.first_name ?? 'cher(e) membre');
        sent++;
      } catch {
        failed++;
      }
    }

    return { failed, sent, total: members.length };
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private todayParts(): { dd: string; mm: string } {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return { dd, mm };
  }

  private async fetchTodayBirthdays(): Promise<BirthdayMember[]> {
    const { mm, dd } = this.todayParts();
    // ISO dates are YYYY-MM-DD — pattern %-MM-DD matches any year
    const pattern = `%-${mm}-${dd}`;

    const client = this.supabaseDataService.admin();
    const { data, error } = await client
      .from('member')
      .select('id, first_name, last_name, email, birth_date')
      .like('birth_date', pattern)
      .eq('status', 'active');

    if (error) {
      this.logger.error('Birthday query failed', error.message);
      throw new Error(error.message);
    }

    return (data ?? []) as BirthdayMember[];
  }

  private async sendBirthdayEmail(toEmail: string, firstName: string): Promise<void> {
    const provider = this.resolveProvider();
    const fromEmail = this.resolveFromEmail();
    const subject = 'Joyeux Anniversaire de la part du CZI !';
    const html = this.buildHtml(firstName);
    const text = this.buildText(firstName);

    if (provider === 'resend') {
      await this.sendWithResend({ fromEmail, html, subject, text, toEmail });
    } else if (provider === 'sendgrid') {
      await this.sendWithSendgrid({ fromEmail, html, subject, text, toEmail });
    } else {
      await this.sendWithMailgun({ fromEmail, html, subject, text, toEmail });
    }
  }

  private buildText(firstName: string): string {
    return [
      `Joyeux Anniversaire ${firstName} !`,
      '',
      "Toute l'équipe du Collectif Zéro Indigent vous souhaite un très joyeux anniversaire.",
      '',
      "Que cette nouvelle année vous apporte santé, bonheur et succès dans toutes vos actions au sein de notre réseau.",
      "Votre engagement pour l'éradication de la pauvreté est une source d'inspiration pour nous tous.",
      '',
      'Avec toute notre amitié et notre gratitude,',
      "L'équipe du Collectif Zéro Indigent",
      '',
      'Tél : +228 79 07 07 16 / 71 15 46 46',
      'Email : czi.infos@gmail.com',
      'Web   : reseauczi.org',
    ].join('\n');
  }

  private buildHtml(firstName: string): string {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Joyeux Anniversaire !</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0c3782 0%,#1a5ab4 55%,#25b4c8 100%);padding:48px 40px 36px;text-align:center;">
            <div style="font-size:52px;margin-bottom:16px;">🎂</div>
            <h1 style="color:#ffffff;margin:0 0 8px;font-size:30px;font-weight:800;letter-spacing:-0.5px;">
              Joyeux Anniversaire !
            </h1>
            <p style="color:rgba(255,255,255,.70);margin:0;font-size:14px;letter-spacing:.5px;">
              DE LA PART DE TOUTE L'ÉQUIPE CZI
            </p>
          </td>
        </tr>

        <!-- Gold accent bar -->
        <tr>
          <td style="background:#cc9b28;height:4px;font-size:0;line-height:0;">&nbsp;</td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <p style="font-size:19px;color:#1a2744;margin:0 0 18px;font-weight:700;">
              Cher(e) ${firstName},
            </p>
            <p style="font-size:15px;color:#4a5568;line-height:1.75;margin:0 0 18px;">
              En ce jour très spécial, toute l'équipe du
              <strong style="color:#0c3782;">Collectif Zéro Indigent</strong>
              se joint à vous pour célébrer votre anniversaire avec joie et reconnaissance.
            </p>
            <p style="font-size:15px;color:#4a5568;line-height:1.75;margin:0 0 28px;">
              Que cette nouvelle année de vie vous apporte <strong>santé</strong>,
              <strong>bonheur</strong> et <strong>succès</strong> dans toutes vos actions
              au sein de notre réseau. Votre engagement pour l'éradication de la pauvreté
              est une source d'inspiration pour chacun d'entre nous.
            </p>

            <!-- Quote card -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:linear-gradient(135deg,#ebf4ff,#e8f8fb);border-left:4px solid #cc9b28;border-radius:8px;padding:20px 24px;">
                  <p style="margin:0;font-size:14px;color:#0c3782;font-style:italic;font-weight:500;line-height:1.6;">
                    « Contribuer à l'éradication de l'extrême pauvreté<br>
                    et de la faim au Togo et en Afrique. »
                  </p>
                </td>
              </tr>
            </table>

            <p style="font-size:15px;color:#4a5568;margin:28px 0 6px;">
              Avec toute notre amitié et notre gratitude,
            </p>
            <p style="font-size:15px;color:#0c3782;font-weight:700;margin:0;">
              L'équipe du Collectif Zéro Indigent
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 6px;font-size:13px;color:#2d3748;font-weight:700;letter-spacing:.5px;">
              COLLECTIF ZÉRO INDIGENT — CZI
            </p>
            <p style="margin:0;font-size:12px;color:#718096;line-height:1.6;">
              Tél : +228 79 07 07 16 / 71 15 46 46
              &nbsp;·&nbsp;
              <a href="mailto:czi.infos@gmail.com" style="color:#1a5ab4;text-decoration:none;">czi.infos@gmail.com</a>
              &nbsp;·&nbsp;
              <a href="https://reseauczi.org" style="color:#1a5ab4;text-decoration:none;">reseauczi.org</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  private resolveProvider(): 'mailgun' | 'resend' | 'sendgrid' {
    const raw = (
      this.configService.get<string>('EMAIL_PROVIDER') || 'resend'
    ).toLowerCase().trim();
    if (raw === 'sendgrid') return 'sendgrid';
    if (raw === 'mailgun') return 'mailgun';
    return 'resend';
  }

  private resolveFromEmail(): string {
    const from = this.configService.get<string>('EMAIL_FROM')?.trim();
    if (!from) throw new Error('EMAIL_FROM non configuré.');
    return from;
  }

  private async sendWithResend(args: {
    fromEmail: string;
    html: string;
    subject: string;
    text: string;
    toEmail: string;
  }): Promise<void> {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) throw new Error('RESEND_API_KEY non configuré.');
    const res = await fetch('https://api.resend.com/emails', {
      body: JSON.stringify({
        from: args.fromEmail,
        html: args.html,
        subject: args.subject,
        text: args.text,
        to: [args.toEmail],
      }),
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      method: 'POST',
    });
    if (!res.ok) throw new Error(`Resend error ${res.status}: ${await res.text()}`);
  }

  private async sendWithSendgrid(args: {
    fromEmail: string;
    html: string;
    subject: string;
    text: string;
    toEmail: string;
  }): Promise<void> {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (!apiKey) throw new Error('SENDGRID_API_KEY non configuré.');
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      body: JSON.stringify({
        content: [
          { type: 'text/plain', value: args.text },
          { type: 'text/html', value: args.html },
        ],
        from: { email: args.fromEmail },
        personalizations: [{ to: [{ email: args.toEmail }] }],
        subject: args.subject,
      }),
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      method: 'POST',
    });
    if (!res.ok) throw new Error(`SendGrid error ${res.status}: ${await res.text()}`);
  }

  private async sendWithMailgun(args: {
    fromEmail: string;
    html: string;
    subject: string;
    text: string;
    toEmail: string;
  }): Promise<void> {
    const apiKey = this.configService.get<string>('MAILGUN_API_KEY');
    const domain = this.configService.get<string>('MAILGUN_DOMAIN');
    const baseUrl =
      this.configService.get<string>('MAILGUN_BASE_URL') || 'https://api.mailgun.net/v3';
    if (!apiKey || !domain) throw new Error('MAILGUN_API_KEY ou MAILGUN_DOMAIN non configurés.');
    const body = new URLSearchParams({
      from: args.fromEmail,
      html: args.html,
      subject: args.subject,
      text: args.text,
      to: args.toEmail,
    });
    const res = await fetch(`${baseUrl}/${domain}/messages`, {
      body,
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
      },
      method: 'POST',
    });
    if (!res.ok) throw new Error(`Mailgun error ${res.status}: ${await res.text()}`);
  }
}
