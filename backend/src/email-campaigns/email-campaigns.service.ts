import { BadRequestException, Injectable } from '@nestjs/common';

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
};

type CampaignStats = {
  failed: number;
  pending: number;
  sent: number;
  skipped: number;
  total: number;
};

type CampaignWithStats = EmailCampaignRow & {
  stats: CampaignStats;
};

@Injectable()
export class EmailCampaignsService {
  constructor(private readonly supabaseDataService: SupabaseDataService) {}

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
    const statsByCampaign = await this.loadCampaignStats(client, items.map((item) => item.id));

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
    const scope = normalizeSingleScope({
      commune_id: payload.commune_id ?? null,
      prefecture_id: payload.prefecture_id ?? null,
      region_id: payload.region_id ?? null,
      scope_type: (payload.audience_scope ?? 'all') as ScopeInput['scope_type'],
    });

    const subject = payload.subject.trim();
    const body = payload.body.trim();
    if (!subject || !body) {
      throw new BadRequestException('Sujet et contenu du mail sont obligatoires.');
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
      throw error ?? new BadRequestException('Impossible de creer la campagne.');
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

    const updatePayload: Database['public']['Tables']['email_campaign']['Update'] = {};
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
        region_id: payload.region_id !== undefined ? payload.region_id : current.region_id,
        scope_type:
          (payload.audience_scope ?? current.audience_scope) as ScopeInput['scope_type'],
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
    await assertCommunicationManager(client);

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

    const recipients = await this.resolveRecipients(client, campaign as EmailCampaignRow);
    if (!recipients.length) {
      throw new BadRequestException(
        'Aucun destinataire email valide pour ce ciblage.',
      );
    }

    const { error: insertError } = await client
      .from('email_campaign_recipient')
      .upsert(recipients, {
        ignoreDuplicates: true,
        onConflict: 'campaign_id,recipient_email',
      });

    if (insertError) {
      throw insertError;
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
      message: `Campagne mise en file (${recipients.length} destinataires).`,
    };
  }

  async markSent(accessToken: string, campaignId: string) {
    const client = this.supabaseDataService.forUser(accessToken);
    await assertCommunicationManager(client);

    const nowIso = new Date().toISOString();
    const { error: recipientsError } = await client
      .from('email_campaign_recipient')
      .update({
        sent_at: nowIso,
        status: 'sent',
      })
      .eq('campaign_id', campaignId)
      .eq('status', 'pending');

    if (recipientsError) {
      throw recipientsError;
    }

    const { error: campaignError } = await client
      .from('email_campaign')
      .update({
        sent_at: nowIso,
        status: 'sent',
      })
      .eq('id', campaignId);

    if (campaignError) {
      throw campaignError;
    }

    const refreshed = await this.getById(accessToken, campaignId);
    return {
      ...refreshed,
      message:
        "Campagne marquee comme envoyee (envoi SMTP/API sera branche a l'etape suivante).",
    };
  }

  private async resolveRecipients(
    client: ReturnType<SupabaseDataService['forUser']>,
    campaign: EmailCampaignRow,
  ) {
    let query = client
      .from('member')
      .select('id, email, region_id, prefecture_id, commune_id');

    if (campaign.audience_scope === 'region' && campaign.region_id) {
      query = query.eq('region_id', campaign.region_id);
    } else if (campaign.audience_scope === 'prefecture' && campaign.prefecture_id) {
      query = query.eq('prefecture_id', campaign.prefecture_id);
    } else if (campaign.audience_scope === 'commune' && campaign.commune_id) {
      query = query.eq('commune_id', campaign.commune_id);
    }

    const { data, error } = await query.limit(10000);
    if (error) {
      throw error;
    }

    const recipients = new Map<
      string,
      Database['public']['Tables']['email_campaign_recipient']['Insert']
    >();

    for (const row of (data ?? []) as MemberEmailRow[]) {
      const email = this.normalizeEmail(row.email);
      if (!email) {
        continue;
      }
      recipients.set(email, {
        campaign_id: campaign.id,
        member_id: row.id,
        recipient_email: email,
        status: 'pending',
      });
    }

    return Array.from(recipients.values());
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

  private normalizeEmail(value: string | null): string | null {
    const email = (value ?? '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      return null;
    }
    return email;
  }
}
