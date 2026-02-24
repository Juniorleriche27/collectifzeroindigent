import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { PostgrestError } from '@supabase/supabase-js';

import {
  getCurrentMemberId,
  requireUserId,
} from '../common/supabase-auth-context';
import { SupabaseDataService } from '../infra/supabase-data.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';

type ConversationRow = {
  commune_id: string | null;
  community_kind: 'czi' | 'engaged' | 'entrepreneur' | 'org_leader' | null;
  conversation_type: 'community' | 'direct';
  created_at: string;
  created_by: string;
  id: string;
  parent_conversation_id: string | null;
  prefecture_id: string | null;
  region_id: string | null;
  scope_type: 'all' | 'region' | 'prefecture' | 'commune';
  title: string | null;
  updated_at: string;
};

type CommunityKind = Exclude<ConversationRow['community_kind'], null>;

const ROOT_COMMUNITY_ORDER: CommunityKind[] = [
  'czi',
  'engaged',
  'entrepreneur',
  'org_leader',
];

const SUBCOMMUNITY_ALLOWED_KINDS: CommunityKind[] = [
  'engaged',
  'entrepreneur',
  'org_leader',
];

type ParticipantRow = {
  can_post: boolean;
  conversation_id: string;
  id: string;
  joined_at: string;
  member_id: string;
};

type MemberLite = {
  email: string | null;
  first_name: string | null;
  id: string;
  last_name: string | null;
  phone: string | null;
};

type MessageRow = {
  body: string;
  conversation_id: string;
  created_at: string;
  deleted_at: string | null;
  id: string;
  sender_member_id: string;
  updated_at: string;
};

@Injectable()
export class ConversationsService {
  constructor(private readonly supabaseDataService: SupabaseDataService) {}

  private readonly conversationSelect =
    'id, conversation_type, title, created_by, scope_type, region_id, prefecture_id, commune_id, community_kind, parent_conversation_id, created_at, updated_at';
  private readonly participantSelect =
    'id, conversation_id, member_id, can_post, joined_at';
  private readonly messageSelect =
    'id, conversation_id, sender_member_id, body, created_at, updated_at, deleted_at';

  async list(
    accessToken: string,
    query: { conversation_type?: string; q?: string },
  ) {
    const client = this.supabaseDataService.forUser(accessToken);
    const userId = await requireUserId(client);
    const memberId = await getCurrentMemberId(client, userId);

    const dbQuery = client
      .from('conversation')
      .select(this.conversationSelect)
      .order('updated_at', { ascending: false })
      .limit(400);

    const { data, error } = await dbQuery;
    if (error) {
      if (this.isMissingCommunityModelError(error)) {
        throw new BadRequestException(
          'Schema communaute non a jour. Executez sql/2026-02-25_cell_community_model.sql.',
        );
      }
      throw error;
    }

    const items = (data ?? []) as ConversationRow[];
    const normalizedItems = this.normalizeConversationFeed(items);
    const filteredItems = this.applyConversationFilters(normalizedItems, query);
    const ids = filteredItems.map((item) => item.id);
    const participants = await this.loadParticipants(client, ids);
    const latestMessages = await this.loadLatestMessages(client, ids);

    const result = filteredItems
      .map((item) => ({
        ...item,
        latest_message: latestMessages.get(item.id) ?? null,
        participants: participants.get(item.id) ?? [],
      }))
      .sort((first, second) => {
        const firstDate =
          first.latest_message?.created_at ??
          first.updated_at ??
          first.created_at;
        const secondDate =
          second.latest_message?.created_at ??
          second.updated_at ??
          second.created_at;
        return secondDate.localeCompare(firstDate);
      });

    return {
      current_member_id: memberId,
      items: result,
    };
  }

  async create(accessToken: string, payload: CreateConversationDto) {
    const client = this.supabaseDataService.forUser(accessToken);
    const userId = await requireUserId(client);
    const memberId = await getCurrentMemberId(client, userId);
    if (!memberId) {
      throw new BadRequestException(
        'Aucun profil membre lie au compte courant.',
      );
    }

    if (payload.conversation_type === 'direct') {
      const participantIds = this.normalizeParticipantIds(
        payload.participant_member_ids,
        memberId,
      );
      const conversationId = randomUUID();

      const { error: createError } = await client.from('conversation').insert({
        id: conversationId,
        community_kind: null,
        conversation_type: 'direct',
        created_by: userId,
        parent_conversation_id: null,
        scope_type: 'all',
        title: payload.title?.trim() || null,
      });

      if (createError) {
        throw this.mapConversationCreateError(
          createError,
          'Conversation directe invalide.',
        );
      }

      const participantRows = [memberId, ...participantIds].map(
        (participantMemberId) => ({
          can_post: true,
          conversation_id: conversationId,
          member_id: participantMemberId,
        }),
      );

      const { error: participantError } = await client
        .from('conversation_participant')
        .insert(participantRows);

      if (participantError) {
        await client.from('conversation').delete().eq('id', conversationId);
        throw this.mapConversationCreateError(
          participantError,
          'Impossible de creer les participants de la conversation.',
        );
      }

      let conversation: ConversationRow | null = null;
      try {
        conversation = await this.loadConversationById(client, conversationId);
      } catch (error) {
        throw this.mapConversationCreateError(
          this.toPostgrestError(error),
          'Conversation directe invalide.',
        );
      }
      if (!conversation) {
        throw new ForbiddenException(
          'Conversation creee mais inaccessible avec les regles actuelles.',
        );
      }

      return {
        item: {
          ...conversation,
          latest_message: null,
          participants: await this.loadConversationParticipants(
            client,
            conversationId,
          ),
        },
        message: 'Conversation directe creee.',
      };
    }

    const title = payload.title?.trim() ?? '';
    if (!title) {
      throw new BadRequestException(
        'Le titre est obligatoire pour une conversation communaute.',
      );
    }
    const parentConversationId = payload.parent_conversation_id?.trim() ?? '';
    if (!parentConversationId) {
      throw new BadRequestException(
        'Selectionnez une communaute de cellule pour creer une sous-communaute.',
      );
    }

    const parentConversation = await this.loadConversationById(
      client,
      parentConversationId,
    );
    if (
      !parentConversation ||
      parentConversation.conversation_type !== 'community'
    ) {
      throw new BadRequestException('Communaute parente introuvable.');
    }
    if (parentConversation.parent_conversation_id) {
      throw new BadRequestException(
        'Selectionnez une communaute racine de cellule.',
      );
    }
    if (
      !parentConversation.community_kind ||
      !SUBCOMMUNITY_ALLOWED_KINDS.includes(parentConversation.community_kind)
    ) {
      throw new ForbiddenException(
        'La creation de sous-communaute est autorisee uniquement dans les cellules.',
      );
    }

    const conversationId = randomUUID();

    const { error } = await client.from('conversation').insert({
      id: conversationId,
      commune_id: null,
      community_kind: parentConversation.community_kind,
      conversation_type: 'community',
      created_by: userId,
      parent_conversation_id: parentConversation.id,
      prefecture_id: null,
      region_id: null,
      scope_type: 'all',
      title,
    });

    if (error) {
      throw this.mapConversationCreateError(
        error,
        'Conversation communaute invalide.',
      );
    }

    let conversation: ConversationRow | null = null;
    try {
      conversation = await this.loadConversationById(client, conversationId);
    } catch (loadError) {
      throw this.mapConversationCreateError(
        this.toPostgrestError(loadError),
        'Conversation communaute invalide.',
      );
    }
    if (!conversation) {
      throw new ForbiddenException(
        'Conversation creee mais inaccessible avec les regles actuelles.',
      );
    }

    return {
      item: { ...conversation, latest_message: null, participants: [] },
      message: 'Sous-communaute creee.',
    };
  }

  async listMessages(
    accessToken: string,
    conversationId: string,
    query: { before?: string; limit?: string },
  ) {
    const client = this.supabaseDataService.forUser(accessToken);
    await requireUserId(client);

    const limit = this.normalizeLimit(query.limit);
    let dbQuery = client
      .from('message')
      .select(this.messageSelect)
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (query.before) {
      dbQuery = dbQuery.lt('created_at', query.before);
    }

    const { data, error } = await dbQuery;
    if (error) {
      throw error;
    }

    const rows = (data ?? []) as MessageRow[];
    const memberIds = Array.from(
      new Set(rows.map((row) => row.sender_member_id).filter(Boolean)),
    );
    const membersById = await this.loadMembersById(client, memberIds);

    return {
      items: rows.map((row) => ({
        ...row,
        sender: membersById.get(row.sender_member_id) ?? null,
      })),
    };
  }

  async postMessage(
    accessToken: string,
    conversationId: string,
    payload: CreateMessageDto,
  ) {
    const client = this.supabaseDataService.forUser(accessToken);
    const userId = await requireUserId(client);
    const memberId = await getCurrentMemberId(client, userId);
    if (!memberId) {
      throw new BadRequestException(
        'Aucun profil membre lie au compte courant.',
      );
    }

    const body = payload.body.trim();
    if (!body) {
      throw new BadRequestException('Le message ne peut pas etre vide.');
    }

    const { data, error } = await client
      .from('message')
      .insert({
        body,
        conversation_id: conversationId,
        sender_member_id: memberId,
      })
      .select(this.messageSelect)
      .single();

    if (error) {
      throw error;
    }
    if (!data) {
      throw new ForbiddenException('Impossible de publier le message.');
    }

    return {
      item: data,
      message: 'Message envoye.',
    };
  }

  private mapConversationCreateError(
    error: PostgrestError | null,
    fallbackMessage: string,
  ): Error {
    if (!error) {
      return new BadRequestException(fallbackMessage);
    }

    if (error.code === '42501') {
      return new ForbiddenException(
        'Permission insuffisante pour creer cette conversation.',
      );
    }

    if (error.code === '23514') {
      return new BadRequestException(
        'Parametres de conversation invalides (scope/type).',
      );
    }

    if (error.code === '23503') {
      return new BadRequestException(
        'Communaute parente invalide ou inaccessible.',
      );
    }

    if (this.isMissingCommunityModelError(error)) {
      return new BadRequestException(
        'Schema communaute non a jour. Executez sql/2026-02-25_cell_community_model.sql.',
      );
    }

    if (error.message?.trim()) {
      return new BadRequestException(error.message.trim());
    }

    return new BadRequestException(fallbackMessage);
  }

  private toPostgrestError(error: unknown): PostgrestError | null {
    if (!error || typeof error !== 'object') {
      return null;
    }

    const maybeError = error as Partial<PostgrestError>;
    if (
      typeof maybeError.code === 'string' &&
      typeof maybeError.message === 'string'
    ) {
      return maybeError as PostgrestError;
    }

    return null;
  }

  private isMissingCommunityModelError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const value = error as Partial<PostgrestError>;
    if (value.code !== '42703') {
      return false;
    }

    const message = value.message ?? '';
    return (
      message.includes('community_kind') ||
      message.includes('parent_conversation_id')
    );
  }

  private normalizeConversationFeed(
    items: ConversationRow[],
  ): ConversationRow[] {
    const directItems = items.filter(
      (item) => item.conversation_type === 'direct',
    );
    const communityItems = items.filter(
      (item) => item.conversation_type === 'community',
    );

    const rootByKind = this.resolveRootCommunities(communityItems);
    const allowedRootIds = new Set(
      Array.from(rootByKind.values()).map((row) => row.id),
    );

    const normalizedCommunityItems = communityItems.filter((item) => {
      if (allowedRootIds.has(item.id)) {
        return true;
      }
      return Boolean(
        item.parent_conversation_id &&
        allowedRootIds.has(item.parent_conversation_id),
      );
    });

    return [...normalizedCommunityItems, ...directItems];
  }

  private applyConversationFilters(
    items: ConversationRow[],
    query: { conversation_type?: string; q?: string },
  ): ConversationRow[] {
    const rootCommunityIds = new Set(
      items
        .filter(
          (item) =>
            item.conversation_type === 'community' &&
            item.parent_conversation_id === null,
        )
        .map((item) => item.id),
    );

    const normalizedSearch =
      query.q?.replaceAll(',', ' ').trim().toLowerCase() ?? '';
    const hasSearch = Boolean(normalizedSearch);
    const requestedType =
      query.conversation_type === 'community' ||
      query.conversation_type === 'direct'
        ? query.conversation_type
        : null;

    return items.filter((item) => {
      if (rootCommunityIds.has(item.id)) {
        return true;
      }

      if (requestedType && item.conversation_type !== requestedType) {
        return false;
      }

      if (!hasSearch) {
        return true;
      }

      const title = item.title?.toLowerCase() ?? '';
      return title.includes(normalizedSearch);
    });
  }

  private resolveRootCommunities(
    communityItems: ConversationRow[],
  ): Map<CommunityKind, ConversationRow> {
    const rootByKind = new Map<CommunityKind, ConversationRow>();

    for (const kind of ROOT_COMMUNITY_ORDER) {
      const candidates = communityItems
        .filter(
          (item) =>
            item.parent_conversation_id === null &&
            item.community_kind === kind,
        )
        .sort((first, second) =>
          first.created_at.localeCompare(second.created_at),
        );
      const canonicalRoot = candidates[0];
      if (canonicalRoot) {
        rootByKind.set(kind, canonicalRoot);
      }
    }

    return rootByKind;
  }

  private normalizeParticipantIds(
    participantMemberIds: string[] | undefined,
    currentMemberId: string,
  ): string[] {
    const cleaned = (participantMemberIds ?? [])
      .map((value) => value.trim())
      .filter((value) => Boolean(value) && value !== currentMemberId);
    const deduped = Array.from(new Set(cleaned));

    if (deduped.length !== 1) {
      throw new BadRequestException(
        'Une conversation privee doit cibler exactement 1 membre.',
      );
    }

    return deduped;
  }

  private normalizeLimit(value: string | undefined): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 1) return 50;
    return Math.min(Math.floor(parsed), 200);
  }

  private async loadConversationById(
    client: ReturnType<SupabaseDataService['forUser']>,
    conversationId: string,
  ): Promise<ConversationRow | null> {
    const { data, error } = await client
      .from('conversation')
      .select(this.conversationSelect)
      .eq('id', conversationId)
      .maybeSingle();

    if (error) {
      if (this.isMissingCommunityModelError(error)) {
        throw new BadRequestException(
          'Schema communaute non a jour. Executez sql/2026-02-25_cell_community_model.sql.',
        );
      }
      throw error;
    }

    return (data as ConversationRow | null) ?? null;
  }

  private async loadMembersById(
    client: ReturnType<SupabaseDataService['forUser']>,
    memberIds: string[],
  ): Promise<Map<string, MemberLite>> {
    if (!memberIds.length) {
      return new Map<string, MemberLite>();
    }

    const { data, error } = await client
      .from('member')
      .select('id, first_name, last_name, email, phone')
      .in('id', memberIds);

    if (error) {
      throw error;
    }

    return new Map(
      ((data ?? []) as MemberLite[]).map((member) => [member.id, member]),
    );
  }

  private async loadParticipants(
    client: ReturnType<SupabaseDataService['forUser']>,
    conversationIds: string[],
  ) {
    if (!conversationIds.length) {
      return new Map<
        string,
        Array<ParticipantRow & { member: MemberLite | null }>
      >();
    }

    const { data, error } = await client
      .from('conversation_participant')
      .select(this.participantSelect)
      .in('conversation_id', conversationIds);

    if (error) {
      throw error;
    }

    const participants = (data ?? []) as ParticipantRow[];
    const memberIds = Array.from(
      new Set(participants.map((participant) => participant.member_id)),
    );
    const membersById = await this.loadMembersById(client, memberIds);
    const byConversation = new Map<
      string,
      Array<ParticipantRow & { member: MemberLite | null }>
    >();

    for (const participant of participants) {
      const row = {
        ...participant,
        member: membersById.get(participant.member_id) ?? null,
      };
      const current = byConversation.get(participant.conversation_id) ?? [];
      current.push(row);
      byConversation.set(participant.conversation_id, current);
    }

    return byConversation;
  }

  private async loadConversationParticipants(
    client: ReturnType<SupabaseDataService['forUser']>,
    conversationId: string,
  ) {
    const grouped = await this.loadParticipants(client, [conversationId]);
    return grouped.get(conversationId) ?? [];
  }

  private async loadLatestMessages(
    client: ReturnType<SupabaseDataService['forUser']>,
    conversationIds: string[],
  ) {
    if (!conversationIds.length) {
      return new Map<string, MessageRow>();
    }

    const { data, error } = await client
      .from('message')
      .select(this.messageSelect)
      .in('conversation_id', conversationIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      throw error;
    }

    const latestByConversation = new Map<string, MessageRow>();
    for (const message of (data ?? []) as MessageRow[]) {
      if (!latestByConversation.has(message.conversation_id)) {
        latestByConversation.set(message.conversation_id, message);
      }
    }

    return latestByConversation;
  }
}
