import { BadRequestException, Injectable } from '@nestjs/common';

import {
  assertCommunicationManager,
  getProfileRoleByUserId,
  isCommunicationManager,
  requireUserId,
} from '../common/supabase-auth-context';
import { normalizeScopes, type ScopeInput } from '../common/scope.util';
import { SupabaseDataService } from '../infra/supabase-data.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

type AnnouncementRow = {
  body: string;
  created_at: string;
  created_by: string;
  id: string;
  is_published: boolean;
  title: string;
  updated_at: string;
};

type AnnouncementScopeRow = {
  announcement_id: string;
  commune_id: string | null;
  created_at: string;
  id: string;
  prefecture_id: string | null;
  region_id: string | null;
  scope_type: 'all' | 'region' | 'prefecture' | 'commune';
};

@Injectable()
export class AnnouncementsService {
  constructor(private readonly supabaseDataService: SupabaseDataService) {}

  private readonly announcementSelect =
    'id, title, body, created_by, is_published, created_at, updated_at';
  private readonly scopeSelect =
    'id, announcement_id, scope_type, region_id, prefecture_id, commune_id, created_at';

  async list(accessToken: string, search?: string) {
    const client = this.supabaseDataService.forUser(accessToken);
    const userId = await requireUserId(client);
    const role = await getProfileRoleByUserId(client, userId);
    const canManage = await isCommunicationManager(client, userId, role);

    let query = client
      .from('announcement')
      .select(this.announcementSelect)
      .order('created_at', { ascending: false })
      .limit(200);

    const normalizedSearch = search?.replaceAll(',', ' ').trim() ?? '';
    if (normalizedSearch) {
      query = query.or(
        `title.ilike.%${normalizedSearch}%,body.ilike.%${normalizedSearch}%`,
      );
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    const items = data ?? [];
    const scopedItems = await this.attachScopes(client, items);
    return {
      can_manage: canManage,
      items: scopedItems,
      role,
    };
  }

  async getById(accessToken: string, announcementId: string) {
    const client = this.supabaseDataService.forUser(accessToken);
    await requireUserId(client);

    const { data, error } = await client
      .from('announcement')
      .select(this.announcementSelect)
      .eq('id', announcementId)
      .maybeSingle();

    if (error) {
      throw error;
    }
    if (!data) {
      return null;
    }

    const scoped = await this.attachScopes(client, [data]);
    return scoped[0] ?? null;
  }

  async create(accessToken: string, payload: CreateAnnouncementDto) {
    const client = this.supabaseDataService.forUser(accessToken);
    const actor = await assertCommunicationManager(client);
    const scopes = normalizeScopes((payload.scopes ?? []) as ScopeInput[]);

    const { data: created, error: insertError } = await client
      .from('announcement')
      .insert({
        body: payload.body.trim(),
        created_by: actor.userId,
        is_published: payload.is_published ?? true,
        title: payload.title.trim(),
      })
      .select(this.announcementSelect)
      .single();

    if (insertError || !created) {
      throw (
        insertError ?? new BadRequestException("Impossible de creer l'annonce.")
      );
    }

    const scopeRows = scopes.map((scope) => ({
      announcement_id: created.id,
      commune_id: scope.commune_id ?? null,
      prefecture_id: scope.prefecture_id ?? null,
      region_id: scope.region_id ?? null,
      scope_type: scope.scope_type,
    }));

    const { error: scopeError } = await client
      .from('announcement_scope')
      .insert(scopeRows);

    if (scopeError) {
      await client.from('announcement').delete().eq('id', created.id);
      throw scopeError;
    }

    const scoped = await this.attachScopes(client, [created]);
    return {
      item: scoped[0] ?? null,
      message: 'Annonce creee.',
    };
  }

  async update(
    accessToken: string,
    announcementId: string,
    payload: UpdateAnnouncementDto,
  ) {
    const client = this.supabaseDataService.forUser(accessToken);
    await assertCommunicationManager(client);

    const updatePayload: Partial<AnnouncementRow> = {};
    if (typeof payload.title === 'string') {
      updatePayload.title = payload.title.trim();
    }
    if (typeof payload.body === 'string') {
      updatePayload.body = payload.body.trim();
    }
    if (typeof payload.is_published === 'boolean') {
      updatePayload.is_published = payload.is_published;
    }

    if (Object.keys(updatePayload).length === 0 && !payload.scopes?.length) {
      throw new BadRequestException('Aucune modification fournie.');
    }

    if (Object.keys(updatePayload).length > 0) {
      const { error: updateError } = await client
        .from('announcement')
        .update(updatePayload)
        .eq('id', announcementId);
      if (updateError) {
        throw updateError;
      }
    }

    if (payload.scopes?.length) {
      const normalizedScopes = normalizeScopes(payload.scopes as ScopeInput[]);
      const { error: clearError } = await client
        .from('announcement_scope')
        .delete()
        .eq('announcement_id', announcementId);
      if (clearError) {
        throw clearError;
      }

      const rows = normalizedScopes.map((scope) => ({
        announcement_id: announcementId,
        commune_id: scope.commune_id ?? null,
        prefecture_id: scope.prefecture_id ?? null,
        region_id: scope.region_id ?? null,
        scope_type: scope.scope_type,
      }));
      const { error: replaceError } = await client
        .from('announcement_scope')
        .insert(rows);
      if (replaceError) {
        throw replaceError;
      }
    }

    const item = await this.getById(accessToken, announcementId);
    return {
      item,
      message: 'Annonce mise a jour.',
    };
  }

  async remove(accessToken: string, announcementId: string) {
    const client = this.supabaseDataService.forUser(accessToken);
    await assertCommunicationManager(client);

    const { data, error } = await client
      .from('announcement')
      .delete()
      .eq('id', announcementId)
      .select('id')
      .maybeSingle();

    if (error) {
      throw error;
    }

    return {
      deleted: Boolean(data),
      message: data
        ? 'Annonce supprimee.'
        : 'Annonce introuvable ou deja supprimee.',
    };
  }

  private async attachScopes(
    client: ReturnType<SupabaseDataService['forUser']>,
    items: AnnouncementRow[],
  ) {
    if (!items.length) {
      return [];
    }

    const ids = items.map((item) => item.id);
    const { data: scopes, error } = await client
      .from('announcement_scope')
      .select(this.scopeSelect)
      .in('announcement_id', ids)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    const byAnnouncement = new Map<string, AnnouncementScopeRow[]>();
    for (const scope of (scopes ?? []) as AnnouncementScopeRow[]) {
      const current = byAnnouncement.get(scope.announcement_id) ?? [];
      current.push(scope);
      byAnnouncement.set(scope.announcement_id, current);
    }

    return items.map((item) => ({
      ...item,
      scopes: byAnnouncement.get(item.id) ?? [],
    }));
  }
}
