import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  assertCommunicationManager,
  getProfileRoleByUserId,
  isCommunicationManager,
  requireUserId,
} from '../common/supabase-auth-context';
import { normalizeSingleScope, type ScopeInput } from '../common/scope.util';
import type { Database } from '../infra/database.types';
import { SupabaseDataService } from '../infra/supabase-data.service';
import { CreateEmailCampaignDto } from './dto/create-email-campaign.dto';
import { UpdateEmailCampaignDto } from './dto/update-email-campaign.dto';

type EmailCampaignRow = Database['public']['Tables']['email_campaign']['Row'];
type EmailCampaignRecipientRow =
  Database['public']['Tables']['email_campaign_recipient']['Row'];

type MemberEmailRow = {
  commune_id: string;
  email: string | null;
  id: string;
  prefecture_id: string;
  region_id: string;
  status: string | null;
};

type CampaignStats = {
  failed: number;
  pending: number;
  sent: number;
  skipped: number;
  total: number;
};

type EmailProvider = 'mailgun' | 'resend' | 'sendgrid';
type DeliveryOutcome = {
  error_message: string | null;
  recipient_id: string;
  sent_at: string | null;
  status: EmailCampaignRecipientRow['status'];
};
type EmailCampaignRecipientInsert =
  Database['public']['Tables']['email_campaign_recipient']['Insert'];
type ResolvedRecipients = {
  pendingRecipients: EmailCampaignRecipientInsert[];
  skippedRecipients: EmailCampaignRecipientInsert[];
};

@Injectable()
export class EmailCampaignsService {
  constructor(
    private readonly supabaseDataService: SupabaseDataService,
    private readonly configService: ConfigService,
  ) {}

  private readonly campaignSelect =
    'id, subject, body, audience_scope, region_id, prefecture_id, commune_id, status, provider, scheduled_at, sent_at, created_by, created_at, updated_at';
  private readonly recipientSelect =
    'id, campaign_id, member_id, recipient_email, status, error_message, sent_at, created_at';

  async list(accessToken: string, search?: string) {
    const client = this.supabaseDataService.forUser(accessToken);
    const userId = await requireUserId(client);
    const role = await getProfileRoleByUserId(client, userId);
    const canManage = await isCommunicationManager(client, userId, role);

    if (!canManage) {
      return {
        can_manage: false,
        items: [],
        role,
      };
    }

    let query = client
      .from('email_campaign')
      .select(this.campaignSelect)
      .order('created_at', { ascending: false })
      .limit(200);

    const normalizedSearch = search?.replaceAll(',', ' ').trim() ?? '';
    if (normalizedSearch) {
      query = query.or(
        `subject.ilike.%${normalizedSearch}%,body.ilike.%${normalizedSearch}%`,
      );
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    const items = (data ?? []) as EmailCampaignRow[];
    const statsByCampaign = await this.loadCampaignStats(
      client,
      items.map((item) => item.id),
    );

    return {
      can_manage: true,
      items: items.map((item) => ({
        ...item,
        stats: statsByCampaign.get(item.id) ?? this.emptyStats(),
      })),
      role,
    };
  }

  async getById(accessToken: string, campaignId: string) {
    const client = this.supabaseDataService.forUser(accessToken);
    await assertCommunicationManager(client);

    const { data, error } = await client
      .from('email_campaign')
      .select(this.campaignSelect)
      .eq('id', campaignId)
      .maybeSingle();

    if (error) {
      throw error;
    }
    if (!data) {
      return null;
    }

    const recipients = await this.loadRecipients(client, campaignId);
    const stats = this.computeStats(recipients);

    return {
      item: data as EmailCampaignRow,
      recipients,
      stats,
    };
  }

  async create(accessToken: string, payload: CreateEmailCampaignDto) {
    const client = this.supabaseDataService.forUser(accessToken);
    const actor = await assertCommunicationManager(client);
    await this.assertCreateRateLimit(client, actor.userId);
    const scope = normalizeSingleScope({
      commune_id: payload.commune_id ?? null,
      prefecture_id: payload.prefecture_id ?? null,
      region_id: payload.region_id ?? null,
      scope_type: (payload.audience_scope ?? 'all') as ScopeInput['scope_type'],
    });

    const subject = payload.subject.trim();
    const body = payload.body.trim();
    if (!subject || !body) {
      throw new BadRequestException(
        'Sujet et contenu du mail sont obligatoires.',
      );
    }

    const { data: campaign, error } = await client
      .from('email_campaign')
      .insert({
        audience_scope: scope.scope_type,
        body,
        commune_id: scope.commune_id ?? null,
        created_by: actor.userId,
        prefecture_id: scope.prefecture_id ?? null,
        provider: payload.provider?.trim() || null,
        region_id: scope.region_id ?? null,
        status: 'draft',
        subject,
      })
      .select(this.campaignSelect)
      .single();

    if (error || !campaign) {
      throw (
        error ?? new BadRequestException('Impossible de creer la campagne.')
      );
    }

    return {
      item: {
        ...(campaign as EmailCampaignRow),
        stats: this.emptyStats(),
      },
      message: 'Campagne email creee en brouillon.',
    };
  }

  async update(
    accessToken: string,
    campaignId: string,
    payload: UpdateEmailCampaignDto,
  ) {
    const client = this.supabaseDataService.forUser(accessToken);
    await assertCommunicationManager(client);

    const { data: current, error: fetchError } = await client
      .from('email_campaign')
      .select(this.campaignSelect)
      .eq('id', campaignId)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }
    if (!current) {
      return null;
    }
    if (current.status === 'sent') {
      throw new BadRequestException(
        'Cette campagne est deja envoyee et ne peut plus etre modifiee.',
      );
    }

    const updatePayload: Database['public']['Tables']['email_campaign']['Update'] =
      {};
    if (typeof payload.subject === 'string') {
      updatePayload.subject = payload.subject.trim();
    }
    if (typeof payload.body === 'string') {
      updatePayload.body = payload.body.trim();
    }
    if (typeof payload.provider === 'string') {
      updatePayload.provider = payload.provider.trim() || null;
    }

    const shouldUpdateScope =
      typeof payload.audience_scope === 'string' ||
      typeof payload.region_id === 'string' ||
      typeof payload.prefecture_id === 'string' ||
      typeof payload.commune_id === 'string';

    if (shouldUpdateScope) {
      const scope = normalizeSingleScope({
        commune_id:
          payload.commune_id !== undefined
            ? payload.commune_id
            : current.commune_id,
        prefecture_id:
          payload.prefecture_id !== undefined
            ? payload.prefecture_id
            : current.prefecture_id,
        region_id:
          payload.region_id !== undefined
            ? payload.region_id
            : current.region_id,
        scope_type: (payload.audience_scope ??
          current.audience_scope) as ScopeInput['scope_type'],
      });

      updatePayload.audience_scope = scope.scope_type;
      updatePayload.region_id = scope.region_id ?? null;
      updatePayload.prefecture_id = scope.prefecture_id ?? null;
      updatePayload.commune_id = scope.commune_id ?? null;
    }

    if (Object.keys(updatePayload).length === 0) {
      throw new BadRequestException('Aucune modification fournie.');
    }

    const { error: updateError } = await client
      .from('email_campaign')
      .update(updatePayload)
      .eq('id', campaignId);

    if (updateError) {
      throw updateError;
    }

    const refreshed = await this.getById(accessToken, campaignId);
    return {
      ...refreshed,
      message: 'Campagne email mise a jour.',
    };
  }

  async queue(accessToken: string, campaignId: string) {
    const client = this.supabaseDataService.forUser(accessToken);
    const actor = await assertCommunicationManager(client);
    await this.assertQueueRateLimit(client, actor.userId);

    const { data: campaign, error: campaignError } = await client
      .from('email_campaign')
      .select(this.campaignSelect)
      .eq('id', campaignId)
      .maybeSingle();

    if (campaignError) {
      throw campaignError;
    }
    if (!campaign) {
      return null;
    }

    if (campaign.status === 'sent') {
      throw new BadRequestException('Cette campagne a deja ete envoyee.');
    }
    if (campaign.status === 'queued') {
      throw new BadRequestException('Cette campagne est deja en file.');
    }

    const { pendingRecipients, skippedRecipients } =
      await this.resolveRecipients(client, campaign as EmailCampaignRow);
    if (!pendingRecipients.length) {
      throw new BadRequestException(
        'Aucun destinataire email valide pour ce ciblage.',
      );
    }

    this.assertRecipientCountWithinLimit(pendingRecipients.length);

    const { error: insertError } = await client
      .from('email_campaign_recipient')
      .upsert(pendingRecipients, {
        ignoreDuplicates: false,
        onConflict: 'campaign_id,recipient_email',
      });

    if (insertError) {
      throw insertError;
    }

    if (skippedRecipients.length > 0) {
      const { error: skippedError } = await client
        .from('email_campaign_recipient')
        .upsert(skippedRecipients, {
          ignoreDuplicates: false,
          onConflict: 'campaign_id,recipient_email',
        });

      if (skippedError) {
        throw skippedError;
      }
    }

    const { error: updateError } = await client
      .from('email_campaign')
      .update({
        scheduled_at: new Date().toISOString(),
        status: 'queued',
      })
      .eq('id', campaignId);

    if (updateError) {
      throw updateError;
    }

    const refreshed = await this.getById(accessToken, campaignId);
    return {
      ...refreshed,
      message: `Campagne mise en file (${pendingRecipients.length} destinataires, ${skippedRecipients.length} ignores).`,
    };
  }

  async markSent(accessToken: string, campaignId: string) {
    const client = this.supabaseDataService.forUser(accessToken);
    const actor = await assertCommunicationManager(client);
    await this.assertSendRateLimit(client, actor.userId);
    const { data: campaign, error: campaignError } = await client
      .from('email_campaign')
      .select(this.campaignSelect)
      .eq('id', campaignId)
      .maybeSingle();

    if (campaignError) {
      throw campaignError;
    }
    if (!campaign) {
      return null;
    }
    if (campaign.status === 'sent') {
      throw new BadRequestException('Cette campagne a deja ete envoyee.');
    }
    if (campaign.status !== 'queued') {
      throw new BadRequestException(
        'Campagne non queuee. Mettez d abord la campagne en file.',
      );
    }

    const pendingRecipients = await this.loadPendingRecipients(
      client,
      campaignId,
    );
    if (!pendingRecipients.length) {
      throw new BadRequestException(
        'Aucun destinataire pending. Mettez la campagne en file avant envoi.',
      );
    }

    this.assertRecipientCountWithinLimit(pendingRecipients.length);

    const provider = this.resolveProvider(campaign.provider);
    const fromEmail = this.resolveFromEmail();
    const outcomes = await this.sendPendingRecipients({
      campaign: campaign as EmailCampaignRow,
      fromEmail,
      pendingRecipients,
      provider,
    });

    await this.persistDeliveryOutcomes(client, outcomes);

    const refreshed = await this.getById(accessToken, campaignId);
    if (!refreshed) {
      throw new BadRequestException(
        "Campagne introuvable apres tentative d'envoi.",
      );
    }

    const nextStatus =
      refreshed.stats.pending > 0
        ? 'queued'
        : refreshed.stats.failed > 0
          ? 'failed'
          : 'sent';

    const { error: updateCampaignError } = await client
      .from('email_campaign')
      .update({
        provider,
        sent_at:
          refreshed.stats.sent > 0 && refreshed.stats.pending === 0
            ? new Date().toISOString()
            : null,
        status: nextStatus,
      })
      .eq('id', campaignId);

    if (updateCampaignError) {
      throw updateCampaignError;
    }

    const finalState = await this.getById(accessToken, campaignId);
    return {
      ...finalState,
      message: `Envoi termine via ${provider}: ${refreshed.stats.sent} envoyes, ${refreshed.stats.failed} echecs, ${refreshed.stats.pending} en attente.`,
    };
  }

  private async resolveRecipients(
    client: ReturnType<SupabaseDataService['forUser']>,
    campaign: EmailCampaignRow,
  ) {
    let query = client
      .from('member')
      .select('id, email, region_id, prefecture_id, commune_id, status')
      .in('status', ['active', 'approved']);

    if (campaign.audience_scope === 'region' && campaign.region_id) {
      query = query.eq('region_id', campaign.region_id);
    } else if (
      campaign.audience_scope === 'prefecture' &&
      campaign.prefecture_id
    ) {
      query = query.eq('prefecture_id', campaign.prefecture_id);
    } else if (campaign.audience_scope === 'commune' && campaign.commune_id) {
      query = query.eq('commune_id', campaign.commune_id);
    }

    const { data, error } = await query.limit(10000);
    if (error) {
      throw error;
    }

    const pendingRecipients = new Map<string, EmailCampaignRecipientInsert>();
    const skippedRecipients = new Map<string, EmailCampaignRecipientInsert>();
    const blockedDomains = this.readBlockedEmailDomains();

    for (const row of (data ?? []) as MemberEmailRow[]) {
      const email = this.normalizeEmail(row.email, blockedDomains);
      if (!email) {
        const raw = (row.email ?? '').trim().toLowerCase();
        if (raw) {
          skippedRecipients.set(raw, {
            campaign_id: campaign.id,
            error_message: 'Email invalide ou domaine bloque.',
            member_id: row.id,
            recipient_email: raw,
            sent_at: null,
            status: 'skipped',
          });
        }
        continue;
      }
      pendingRecipients.set(email, {
        campaign_id: campaign.id,
        error_message: null,
        member_id: row.id,
        recipient_email: email,
        sent_at: null,
        status: 'pending',
      });
    }

    return {
      pendingRecipients: Array.from(pendingRecipients.values()),
      skippedRecipients: Array.from(skippedRecipients.values()),
    } satisfies ResolvedRecipients;
  }

  private async loadPendingRecipients(
    client: ReturnType<SupabaseDataService['forUser']>,
    campaignId: string,
  ) {
    const batchSize = this.readPositiveIntEnv('EMAIL_SEND_BATCH_SIZE', 500);
    const { data, error } = await client
      .from('email_campaign_recipient')
      .select(this.recipientSelect)
      .eq('campaign_id', campaignId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(batchSize);

    if (error) {
      throw error;
    }

    return (data ?? []) as EmailCampaignRecipientRow[];
  }

  private async sendPendingRecipients(args: {
    campaign: EmailCampaignRow;
    fromEmail: string;
    pendingRecipients: EmailCampaignRecipientRow[];
    provider: EmailProvider;
  }) {
    const { campaign, fromEmail, pendingRecipients, provider } = args;
    const outcomes: DeliveryOutcome[] = [];

    for (const recipient of pendingRecipients) {
      try {
        await this.sendEmailWithProvider({
          body: campaign.body,
          fromEmail,
          provider,
          subject: campaign.subject,
          toEmail: recipient.recipient_email,
        });

        outcomes.push({
          error_message: null,
          recipient_id: recipient.id,
          sent_at: new Date().toISOString(),
          status: 'sent',
        });
      } catch (error) {
        outcomes.push({
          error_message: this.toDeliveryErrorMessage(error),
          recipient_id: recipient.id,
          sent_at: null,
          status: 'failed',
        });
      }
    }

    return outcomes;
  }

  private async persistDeliveryOutcomes(
    client: ReturnType<SupabaseDataService['forUser']>,
    outcomes: DeliveryOutcome[],
  ) {
    for (const outcome of outcomes) {
      const { error } = await client
        .from('email_campaign_recipient')
        .update({
          error_message: outcome.error_message,
          sent_at: outcome.sent_at,
          status: outcome.status,
        })
        .eq('id', outcome.recipient_id);

      if (error) {
        throw error;
      }
    }
  }

  private async sendEmailWithProvider(args: {
    body: string;
    fromEmail: string;
    provider: EmailProvider;
    subject: string;
    toEmail: string;
  }) {
    const { body, fromEmail, provider, subject, toEmail } = args;
    if (provider === 'resend') {
      await this.sendWithResend({ body, fromEmail, subject, toEmail });
      return;
    }
    if (provider === 'sendgrid') {
      await this.sendWithSendgrid({ body, fromEmail, subject, toEmail });
      return;
    }
    await this.sendWithMailgun({ body, fromEmail, subject, toEmail });
  }

  private async sendWithResend(args: {
    body: string;
    fromEmail: string;
    subject: string;
    toEmail: string;
  }) {
    const apiKey = this.requireEnv('RESEND_API_KEY');
    const response = await fetch('https://api.resend.com/emails', {
      body: JSON.stringify({
        from: args.fromEmail,
        subject: args.subject,
        text: args.body,
        to: [args.toEmail],
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(await this.extractProviderError('resend', response));
    }
  }

  private async sendWithSendgrid(args: {
    body: string;
    fromEmail: string;
    subject: string;
    toEmail: string;
  }) {
    const apiKey = this.requireEnv('SENDGRID_API_KEY');
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      body: JSON.stringify({
        content: [{ type: 'text/plain', value: args.body }],
        from: { email: args.fromEmail },
        personalizations: [{ to: [{ email: args.toEmail }] }],
        subject: args.subject,
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(await this.extractProviderError('sendgrid', response));
    }
  }

  private async sendWithMailgun(args: {
    body: string;
    fromEmail: string;
    subject: string;
    toEmail: string;
  }) {
    const apiKey = this.requireEnv('MAILGUN_API_KEY');
    const domain = this.requireEnv('MAILGUN_DOMAIN');
    const baseUrl =
      this.configService.get<string>('MAILGUN_BASE_URL')?.trim() ||
      'https://api.mailgun.net/v3';

    const response = await fetch(`${baseUrl}/${domain}/messages`, {
      body: new URLSearchParams({
        from: args.fromEmail,
        subject: args.subject,
        text: args.body,
        to: args.toEmail,
      }),
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
      },
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(await this.extractProviderError('mailgun', response));
    }
  }

  private resolveProvider(campaignProvider: string | null): EmailProvider {
    const rawProvider = (
      campaignProvider?.trim() ||
      this.configService.get<string>('EMAIL_PROVIDER')?.trim() ||
      'resend'
    ).toLowerCase();

    if (rawProvider === 'resend') return 'resend';
    if (rawProvider === 'sendgrid') return 'sendgrid';
    if (rawProvider === 'mailgun') return 'mailgun';

    throw new BadRequestException(
      `Provider email non supporte: ${rawProvider}. Utilisez resend, sendgrid ou mailgun.`,
    );
  }

  private resolveFromEmail(): string {
    const fromEmail =
      this.configService.get<string>('EMAIL_FROM')?.trim() ||
      this.configService.get<string>('MAIL_FROM')?.trim() ||
      '';

    if (!fromEmail || !fromEmail.includes('@')) {
      throw new BadRequestException(
        "EMAIL_FROM manquant ou invalide. Configurez l'adresse expediteur dans le backend.",
      );
    }

    return fromEmail;
  }

  private requireEnv(name: string): string {
    const value = this.configService.get<string>(name)?.trim() ?? '';
    if (!value) {
      throw new BadRequestException(
        `${name} manquant. Configurez les variables du provider email dans le backend.`,
      );
    }
    return value;
  }

  private async extractProviderError(provider: string, response: Response) {
    const rawBody = await response.text();
    if (!rawBody) {
      return `${provider}: HTTP ${response.status}`;
    }

    try {
      const parsed = JSON.parse(rawBody) as {
        error?: unknown;
        message?: unknown;
      };
      if (typeof parsed.message === 'string' && parsed.message.trim()) {
        return `${provider}: ${parsed.message.trim()}`;
      }
      if (typeof parsed.error === 'string' && parsed.error.trim()) {
        return `${provider}: ${parsed.error.trim()}`;
      }
    } catch {
      // Ignore JSON parsing errors and return the raw text.
    }

    return `${provider}: ${rawBody.slice(0, 240)}`;
  }

  private toDeliveryErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message.trim()) {
      return error.message.trim().slice(0, 500);
    }
    return 'Erreur envoi provider.';
  }

  private async assertCreateRateLimit(
    client: ReturnType<SupabaseDataService['forUser']>,
    userId: string,
  ) {
    const maxCreatePerHour = this.readPositiveIntEnv(
      'EMAIL_CAMPAIGN_MAX_CREATE_PER_HOUR',
      20,
    );
    const createdLastHour = await this.countCampaignsSince(
      client,
      userId,
      'created_at',
      60,
    );

    if (createdLastHour >= maxCreatePerHour) {
      throw new BadRequestException(
        `Rate limit creation atteint (${maxCreatePerHour}/h). Reessayez plus tard.`,
      );
    }
  }

  private async assertQueueRateLimit(
    client: ReturnType<SupabaseDataService['forUser']>,
    userId: string,
  ) {
    const maxQueuePerHour = this.readPositiveIntEnv(
      'EMAIL_CAMPAIGN_MAX_QUEUE_PER_HOUR',
      20,
    );
    const queuedLastHour = await this.countCampaignsSince(
      client,
      userId,
      'scheduled_at',
      60,
    );

    if (queuedLastHour >= maxQueuePerHour) {
      throw new BadRequestException(
        `Rate limit mise en file atteint (${maxQueuePerHour}/h). Reessayez plus tard.`,
      );
    }
  }

  private async assertSendRateLimit(
    client: ReturnType<SupabaseDataService['forUser']>,
    userId: string,
  ) {
    const maxSendPerHour = this.readPositiveIntEnv(
      'EMAIL_CAMPAIGN_MAX_SEND_PER_HOUR',
      8,
    );
    const maxSendPerDay = this.readPositiveIntEnv(
      'EMAIL_CAMPAIGN_MAX_SEND_PER_DAY',
      40,
    );
    const minSecondsBetweenSends = this.readPositiveIntEnv(
      'EMAIL_CAMPAIGN_MIN_SECONDS_BETWEEN_SENDS',
      20,
    );

    const [sentLastHour, sentLastDay] = await Promise.all([
      this.countCampaignsSince(client, userId, 'sent_at', 60),
      this.countCampaignsSince(client, userId, 'sent_at', 60 * 24),
    ]);

    if (sentLastHour >= maxSendPerHour) {
      throw new BadRequestException(
        `Rate limit envoi atteint (${maxSendPerHour}/h). Reessayez plus tard.`,
      );
    }
    if (sentLastDay >= maxSendPerDay) {
      throw new BadRequestException(
        `Rate limit envoi quotidien atteint (${maxSendPerDay}/jour). Reessayez demain.`,
      );
    }

    const { data, error } = await client
      .from('email_campaign')
      .select('sent_at')
      .eq('created_by', userId)
      .not('sent_at', 'is', null)
      .order('sent_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    const latestSentAt = data?.sent_at
      ? new Date(data.sent_at).getTime()
      : null;
    if (!latestSentAt) {
      return;
    }

    const elapsedSeconds = Math.floor((Date.now() - latestSentAt) / 1000);
    if (elapsedSeconds < minSecondsBetweenSends) {
      throw new BadRequestException(
        `Envoi trop frequent. Attendez ${minSecondsBetweenSends - elapsedSeconds}s.`,
      );
    }
  }

  private async countCampaignsSince(
    client: ReturnType<SupabaseDataService['forUser']>,
    userId: string,
    timestampColumn: 'created_at' | 'scheduled_at' | 'sent_at',
    minutes: number,
  ) {
    const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();
    const { count, error } = await client
      .from('email_campaign')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', userId)
      .not(timestampColumn, 'is', null)
      .gte(timestampColumn, since);

    if (error) {
      throw error;
    }

    return count ?? 0;
  }

  private assertRecipientCountWithinLimit(count: number) {
    const maxRecipients = this.readPositiveIntEnv(
      'EMAIL_CAMPAIGN_MAX_RECIPIENTS',
      5000,
    );
    if (count > maxRecipients) {
      throw new BadRequestException(
        `Nombre de destinataires trop eleve (${count}). Maximum autorise: ${maxRecipients}.`,
      );
    }
  }

  private readPositiveIntEnv(name: string, fallback: number): number {
    const raw = this.configService.get<string>(name);
    if (!raw) {
      return fallback;
    }
    const value = Number.parseInt(raw, 10);
    if (!Number.isFinite(value) || value <= 0) {
      return fallback;
    }
    return value;
  }

  private readBlockedEmailDomains(): Set<string> {
    const raw = this.configService.get<string>('EMAIL_BLOCKED_DOMAINS') ?? '';
    return new Set(
      raw
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean),
    );
  }

  private async loadRecipients(
    client: ReturnType<SupabaseDataService['forUser']>,
    campaignId: string,
  ) {
    const { data, error } = await client
      .from('email_campaign_recipient')
      .select(this.recipientSelect)
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: true })
      .limit(2000);

    if (error) {
      throw error;
    }

    return (data ?? []) as EmailCampaignRecipientRow[];
  }

  private async loadCampaignStats(
    client: ReturnType<SupabaseDataService['forUser']>,
    campaignIds: string[],
  ) {
    if (!campaignIds.length) {
      return new Map<string, CampaignStats>();
    }

    const { data, error } = await client
      .from('email_campaign_recipient')
      .select('campaign_id, status')
      .in('campaign_id', campaignIds);

    if (error) {
      throw error;
    }

    const statsByCampaign = new Map<string, CampaignStats>();
    for (const campaignId of campaignIds) {
      statsByCampaign.set(campaignId, this.emptyStats());
    }

    for (const row of (data ?? []) as Array<{
      campaign_id: string;
      status: EmailCampaignRecipientRow['status'];
    }>) {
      const stats = statsByCampaign.get(row.campaign_id) ?? this.emptyStats();
      stats.total += 1;
      if (row.status === 'pending') stats.pending += 1;
      if (row.status === 'sent') stats.sent += 1;
      if (row.status === 'failed') stats.failed += 1;
      if (row.status === 'skipped') stats.skipped += 1;
      statsByCampaign.set(row.campaign_id, stats);
    }

    return statsByCampaign;
  }

  private computeStats(recipients: EmailCampaignRecipientRow[]): CampaignStats {
    const stats = this.emptyStats();
    for (const row of recipients) {
      stats.total += 1;
      if (row.status === 'pending') stats.pending += 1;
      if (row.status === 'sent') stats.sent += 1;
      if (row.status === 'failed') stats.failed += 1;
      if (row.status === 'skipped') stats.skipped += 1;
    }
    return stats;
  }

  private emptyStats(): CampaignStats {
    return {
      failed: 0,
      pending: 0,
      sent: 0,
      skipped: 0,
      total: 0,
    };
  }

  private normalizeEmail(
    value: string | null,
    blockedDomains: Set<string>,
  ): string | null {
    const email = (value ?? '').trim().toLowerCase();
    if (!email) {
      return null;
    }
    const matchesBasicFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!matchesBasicFormat) {
      return null;
    }

    const domain = email.split('@')[1]?.trim().toLowerCase() ?? '';
    if (!domain || blockedDomains.has(domain)) {
      return null;
    }

    return email;
  }
}
