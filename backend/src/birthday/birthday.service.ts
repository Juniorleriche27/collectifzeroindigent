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

type BirthdayMemberWithProfile = BirthdayMember & {
  education_level: string | null;
  engagement_domains: string[] | null;
  gender: string | null;
  goal_3_6_months: string | null;
  locality: string | null;
  occupation_status: string | null;
  photo_url: string | null;
  profession_title: string | null;
  skills_tags: string[] | null;
};

export type PublicBirthdayItem = {
  id: string;
  message: string;
  name: string;
  photo_url: string | null;
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
    const members = await this.fetchTodayBirthdaysWithProfile();

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
        const message = await this.generateAIMessage(member);
        await this.sendBirthdayEmail(member.email, member.first_name ?? 'cher(e) membre', message);
        sent++;
      } catch (err) {
        failed++;
        this.logger.warn(
          `Failed birthday email to ${member.email}: ${(err as Error).message}`,
        );
      }
    }

    this.logger.log(`Birthday emails: ${sent} sent, ${failed} failed`);
  }

  /** Public data for the website — no auth required */
  async getPublicBirthdays(): Promise<PublicBirthdayItem[]> {
    const members = await this.fetchTodayBirthdaysWithProfile();
    const results: PublicBirthdayItem[] = [];

    for (const member of members.slice(0, 8)) {
      const [message, photoUrl] = await Promise.all([
        this.generateAIMessage(member).catch(() => this.fallbackMessage(member.first_name ?? 'cher(e) membre')),
        this.resolvePhotoUrl(member.photo_url),
      ]);

      results.push({
        id: member.id,
        message,
        name: [member.first_name, member.last_name].filter(Boolean).join(' ') || 'Membre CZI',
        photo_url: photoUrl,
      });
    }

    return results;
  }

  /** Admin: list today birthdays */
  async listTodayBirthdays(): Promise<BirthdayMember[]> {
    return this.fetchTodayBirthdays();
  }

  /** Admin: manually trigger sending */
  async triggerTodaySend(): Promise<{ failed: number; sent: number; total: number }> {
    const members = await this.fetchTodayBirthdaysWithProfile();
    let sent = 0;
    let failed = 0;

    for (const member of members) {
      if (!member.email) continue;
      try {
        const message = await this.generateAIMessage(member).catch(
          () => this.fallbackMessage(member.first_name ?? 'cher(e) membre'),
        );
        await this.sendBirthdayEmail(member.email, member.first_name ?? 'cher(e) membre', message);
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
    const pattern = `%-${mm}-${dd}`;
    const client = this.supabaseDataService.admin();
    const { data, error } = await client
      .from('member')
      .select('id, first_name, last_name, email, birth_date')
      .like('birth_date', pattern)
      .eq('status', 'active');

    if (error) throw new Error(error.message);
    return (data ?? []) as BirthdayMember[];
  }

  private async fetchTodayBirthdaysWithProfile(): Promise<BirthdayMemberWithProfile[]> {
    const { mm, dd } = this.todayParts();
    const pattern = `%-${mm}-${dd}`;
    const client = this.supabaseDataService.admin();
    const { data, error } = await client
      .from('member')
      .select(
        'id, first_name, last_name, email, birth_date, photo_url, profession_title, locality, skills_tags, engagement_domains, goal_3_6_months, occupation_status, education_level, gender',
      )
      .like('birth_date', pattern)
      .eq('status', 'active');

    if (error) throw new Error(error.message);
    return (data ?? []) as BirthdayMemberWithProfile[];
  }

  /** Generate a signed URL for member photo storage path, or return external URL directly */
  private async resolvePhotoUrl(photoUrl: string | null): Promise<string | null> {
    if (!photoUrl) return null;
    if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) return photoUrl;

    try {
      const client = this.supabaseDataService.admin();
      const { data } = await client.storage
        .from('member-photos')
        .createSignedUrl(photoUrl, 86400); // 24h
      return data?.signedUrl ?? null;
    } catch {
      return null;
    }
  }

  /** Call Cohere to generate a personalized birthday message */
  private async generateAIMessage(member: BirthdayMemberWithProfile): Promise<string> {
    const apiKey = this.configService.get<string>('COHERE_API_KEY');
    if (!apiKey) return this.fallbackMessage(member.first_name ?? 'cher(e) membre');

    const model =
      this.configService.get<string>('COHERE_MODEL')?.trim() || 'command-r-plus';

    const firstName = member.first_name ?? 'cher(e) membre';
    const profileLines: string[] = [];

    if (member.profession_title) profileLines.push(`Profession : ${member.profession_title}`);
    if (member.locality) profileLines.push(`Localité : ${member.locality}`);
    if (member.occupation_status) profileLines.push(`Statut : ${member.occupation_status}`);
    if (member.education_level) profileLines.push(`Niveau d'études : ${member.education_level}`);
    if (Array.isArray(member.engagement_domains) && member.engagement_domains.length > 0) {
      profileLines.push(`Domaines d'engagement : ${member.engagement_domains.join(', ')}`);
    }
    if (Array.isArray(member.skills_tags) && member.skills_tags.length > 0) {
      profileLines.push(`Compétences : ${member.skills_tags.slice(0, 5).join(', ')}`);
    }
    if (member.goal_3_6_months) {
      profileLines.push(`Objectif actuel : ${member.goal_3_6_months.slice(0, 120)}`);
    }

    const profileSummary =
      profileLines.length > 0
        ? profileLines.join('\n')
        : 'Membre actif(ve) du réseau CZI.';

    const preamble = `Tu représentes le Collectif Zéro Indigent (CZI), organisation togolaise engagée dans la lutte contre l'extrême pauvreté et la faim en Afrique. Tu rédiges des messages d'anniversaire chaleureux et personnalisés pour les membres du réseau.`;

    const message = `C'est aujourd'hui l'anniversaire de ${firstName}, membre actif(ve) du CZI.

Voici ce que nous savons de ${firstName} :
${profileSummary}

Rédige un message d'anniversaire chaleureux et personnalisé en français. Règles strictes :
- Commence directement par "Cher/Chère ${firstName},"
- Mentionne au moins un élément spécifique de son profil (profession, engagement, compétences, localité ou objectif)
- Chaleureux, sincère, motivant
- Un seul paragraphe fluide de 3 à 4 phrases
- Maximum 90 mots, aucun markdown, aucune liste
- Termine avec des vœux de l'équipe CZI`;

    const response = await fetch('https://api.cohere.ai/v1/chat', {
      body: JSON.stringify({
        max_tokens: 200,
        message,
        model,
        preamble,
        temperature: 0.75,
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Cohere error ${response.status}`);
    }

    const json = (await response.json()) as { text?: string };
    const text = json.text?.trim();
    if (!text) throw new Error('Empty Cohere response');
    return text;
  }

  private fallbackMessage(firstName: string): string {
    return `Cher/Chère ${firstName}, en ce jour spécial, toute l'équipe du Collectif Zéro Indigent vous adresse ses vœux les plus chaleureux. Que cette nouvelle année de vie vous apporte santé, bonheur et succès dans toutes vos actions au sein de notre réseau. Votre engagement pour l'éradication de la pauvreté est une source d'inspiration pour chacun d'entre nous. Joyeux Anniversaire de la part de l'équipe CZI !`;
  }

  private async sendBirthdayEmail(
    toEmail: string,
    firstName: string,
    aiMessage: string,
  ): Promise<void> {
    const provider = this.resolveProvider();
    const fromEmail = this.resolveFromEmail();
    const subject = 'Joyeux Anniversaire de la part du CZI !';
    const html = this.buildHtml(firstName, aiMessage);
    const text = this.buildText(firstName, aiMessage);

    if (provider === 'resend') {
      await this.sendWithResend({ fromEmail, html, subject, text, toEmail });
    } else if (provider === 'sendgrid') {
      await this.sendWithSendgrid({ fromEmail, html, subject, text, toEmail });
    } else {
      await this.sendWithMailgun({ fromEmail, html, subject, text, toEmail });
    }
  }

  private buildText(firstName: string, aiMessage: string): string {
    return [
      `Joyeux Anniversaire ${firstName} !`,
      '',
      aiMessage,
      '',
      'Avec toute notre amitié et notre gratitude,',
      "L'équipe du Collectif Zéro Indigent",
      '',
      'Tél : +228 79 07 07 16 / 71 15 46 46',
      'Email : czi.infos@gmail.com',
      'Web   : reseauczi.org',
    ].join('\n');
  }

  private buildHtml(firstName: string, aiMessage: string): string {
    const escapedMessage = aiMessage
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');

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
        <tr>
          <td style="background:linear-gradient(135deg,#0c3782 0%,#1a5ab4 55%,#25b4c8 100%);padding:48px 40px 36px;text-align:center;">
            <div style="font-size:52px;margin-bottom:16px;">🎂</div>
            <h1 style="color:#ffffff;margin:0 0 8px;font-size:30px;font-weight:800;letter-spacing:-0.5px;">Joyeux Anniversaire !</h1>
            <p style="color:rgba(255,255,255,.70);margin:0;font-size:14px;letter-spacing:.5px;">DE LA PART DE TOUTE L'ÉQUIPE CZI</p>
          </td>
        </tr>
        <tr><td style="background:#cc9b28;height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr>
          <td style="padding:40px 40px 32px;">
            <p style="font-size:15px;color:#4a5568;line-height:1.8;margin:0 0 28px;white-space:pre-line;">${escapedMessage}</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:linear-gradient(135deg,#ebf4ff,#e8f8fb);border-left:4px solid #cc9b28;border-radius:8px;padding:20px 24px;">
                  <p style="margin:0;font-size:13px;color:#0c3782;font-style:italic;line-height:1.6;">
                    « Contribuer à l'éradication de l'extrême pauvreté et de la faim au Togo et en Afrique. »
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 6px;font-size:13px;color:#2d3748;font-weight:700;letter-spacing:.5px;">COLLECTIF ZÉRO INDIGENT — CZI</p>
            <p style="margin:0;font-size:12px;color:#718096;line-height:1.6;">
              Tél : +228 79 07 07 16 / 71 15 46 46 &nbsp;·&nbsp;
              <a href="mailto:czi.infos@gmail.com" style="color:#1a5ab4;text-decoration:none;">czi.infos@gmail.com</a> &nbsp;·&nbsp;
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
    const raw = (this.configService.get<string>('EMAIL_PROVIDER') || 'resend').toLowerCase().trim();
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
    fromEmail: string; html: string; subject: string; text: string; toEmail: string;
  }): Promise<void> {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) throw new Error('RESEND_API_KEY non configuré.');
    const res = await fetch('https://api.resend.com/emails', {
      body: JSON.stringify({ from: args.fromEmail, html: args.html, subject: args.subject, text: args.text, to: [args.toEmail] }),
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      method: 'POST',
    });
    if (!res.ok) throw new Error(`Resend error ${res.status}: ${await res.text()}`);
  }

  private async sendWithSendgrid(args: {
    fromEmail: string; html: string; subject: string; text: string; toEmail: string;
  }): Promise<void> {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (!apiKey) throw new Error('SENDGRID_API_KEY non configuré.');
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      body: JSON.stringify({
        content: [{ type: 'text/plain', value: args.text }, { type: 'text/html', value: args.html }],
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
    fromEmail: string; html: string; subject: string; text: string; toEmail: string;
  }): Promise<void> {
    const apiKey = this.configService.get<string>('MAILGUN_API_KEY');
    const domain = this.configService.get<string>('MAILGUN_DOMAIN');
    const baseUrl = this.configService.get<string>('MAILGUN_BASE_URL') || 'https://api.mailgun.net/v3';
    if (!apiKey || !domain) throw new Error('MAILGUN_API_KEY ou MAILGUN_DOMAIN non configurés.');
    const res = await fetch(`${baseUrl}/${domain}/messages`, {
      body: new URLSearchParams({ from: args.fromEmail, html: args.html, subject: args.subject, text: args.text, to: args.toEmail }),
      headers: { Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}` },
      method: 'POST',
    });
    if (!res.ok) throw new Error(`Mailgun error ${res.status}: ${await res.text()}`);
  }
}
