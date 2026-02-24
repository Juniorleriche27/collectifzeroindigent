import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
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
import { UpdateMessageDto } from './dto/update-message.dto';

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
  last_read_at: string | null;
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
  edited_at: string | null;
  id: string;
  mention_member_ids: string[] | null;
  parent_message_id: string | null;
  sender_member_id: string;
  updated_at: string;
};

type MessageLikeRow = {
  member_id: string;
  message_id: string;
  reaction: 'like';
};

@Injectable()
export class ConversationsService {
  constructor(private readonly supabaseDataService: SupabaseDataService) {}

  private readonly conversationSelect =
    'id, conversation_type, title, created_by, scope_type, region_id, prefecture_id, commune_id, community_kind, parent_conversation_id, created_at, updated_at';
  private readonly participantSelect =
    'id, conversation_id, member_id, can_post, joined_at, last_read_at';
  private readonly messageSelect =
    'id, conversation_id, sender_member_id, parent_message_id, body, mention_member_ids, created_at, updated_at, edited_at, deleted_at';

  async list(
    accessToken: string,
    query: { conversation_type?: string; q?: string },
  ) {
    const client = this.supabaseDataService.forUser(accessToken);
    const userId = await requireUserId(client);
    const memberId = await getCurrentMemberId(client, userId);
    const canManageCommunication =
      await this.resolveCanManageCommunication(client);

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
    const unreadCounts = await this.loadUnreadCounts(client, ids);
    const latestMessages = await this.loadLatestMessages(client, ids);

    const result = filteredItems
      .map((item) => ({
        ...item,
        can_delete:
          item.conversation_type === 'community' &&
          item.parent_conversation_id !== null &&
          (item.created_by === userId || canManageCommunication),
        unread_count: unreadCounts.get(item.id) ?? 0,
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
          can_delete: false,
          unread_count: 0,
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
      item: {
        ...conversation,
        can_delete: true,
        unread_count: 0,
        latest_message: null,
        participants: [],
      },
      message: 'Sous-communaute creee.',
    };
  }

  async deleteConversation(accessToken: string, conversationId: string) {
    const client = this.supabaseDataService.forUser(accessToken);
    await requireUserId(client);

    const conversation = await this.loadConversationById(
      client,
      conversationId,
    );
    if (!conversation) {
      throw new NotFoundException('Conversation introuvable.');
    }

    if (
      conversation.conversation_type !== 'community' ||
      conversation.parent_conversation_id === null
    ) {
      throw new BadRequestException(
        'Seules les sous-communautes peuvent etre supprimees.',
      );
    }

    const { data, error } = await client
      .from('conversation')
      .delete()
      .eq('id', conversationId)
      .select('id')
      .maybeSingle();

    if (error) {
      if (error.code === '42501') {
        throw new ForbiddenException(
          'Permission insuffisante pour supprimer cette sous-communaute.',
        );
      }
      throw error;
    }
    if (!data) {
      throw new ForbiddenException(
        'Permission insuffisante pour supprimer cette sous-communaute.',
      );
    }

    return {
      deleted: true,
      message: 'Sous-communaute supprimee.',
    };
  }

  async listMessages(
    accessToken: string,
    conversationId: string,
    query: { before?: string; limit?: string },
  ) {
    const client = this.supabaseDataService.forUser(accessToken);
    const userId = await requireUserId(client);
    const currentMemberId = await getCurrentMemberId(client, userId);
    const canManageCommunication =
      await this.resolveCanManageCommunication(client);

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
      if (this.isMissingSocialMessageModelError(error)) {
        throw new BadRequestException(
          'Schema message social non a jour. Executez sql/2026-02-25_message_social_features.sql.',
        );
      }
      throw error;
    }

    const rows = (data ?? []) as MessageRow[];
    const memberIds = Array.from(
      new Set(rows.map((row) => row.sender_member_id).filter(Boolean)),
    );
    const membersById = await this.loadMembersById(client, memberIds);
    const messageIds = rows.map((row) => row.id);
    const likeStats = await this.loadMessageLikeStats(
      client,
      messageIds,
      currentMemberId,
    );
    await this.markConversationAsRead(client, conversationId);

    return {
      items: rows.map((row) => ({
        can_delete:
          row.sender_member_id === currentMemberId || canManageCommunication,
        ...row,
        like_count: likeStats.countByMessage.get(row.id) ?? 0,
        liked_by_me: likeStats.likedByMessage.has(row.id),
        mention_member_ids: row.mention_member_ids ?? [],
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
    const parentMessageId = payload.parent_message_id?.trim() ?? null;
    const mentionMemberIds = this.normalizeMentionMemberIds(
      payload.mention_member_ids,
    );
    await this.ensureParentMessage(
      client,
      conversationId,
      parentMessageId,
      'Message parent introuvable.',
    );

    const { data, error } = await client
      .from('message')
      .insert({
        body,
        conversation_id: conversationId,
        mention_member_ids: mentionMemberIds,
        parent_message_id: parentMessageId,
        sender_member_id: memberId,
      })
      .select(this.messageSelect)
      .single();

    if (error) {
      if (this.isMissingSocialMessageModelError(error)) {
        throw new BadRequestException(
          'Schema message social non a jour. Executez sql/2026-02-25_message_social_features.sql.',
        );
      }
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

  async updateMessage(
    accessToken: string,
    conversationId: string,
    messageId: string,
    payload: UpdateMessageDto,
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
    const mentionMemberIds = this.normalizeMentionMemberIds(
      payload.mention_member_ids,
    );

    const { data, error } = await client
      .from('message')
      .update({
        body,
        edited_at: new Date().toISOString(),
        mention_member_ids: mentionMemberIds,
      })
      .eq('conversation_id', conversationId)
      .eq('id', messageId)
      .select(this.messageSelect)
      .single();

    if (error) {
      if (this.isMissingSocialMessageModelError(error)) {
        throw new BadRequestException(
          'Schema message social non a jour. Executez sql/2026-02-25_message_social_features.sql.',
        );
      }
      if (error.code === '42501') {
        throw new ForbiddenException(
          'Permission insuffisante pour modifier ce message.',
        );
      }
      throw error;
    }
    if (!data) {
      throw new NotFoundException('Message introuvable.');
    }

    return {
      item: data,
      message: 'Message modifie.',
    };
  }

  async toggleMessageLike(
    accessToken: string,
    conversationId: string,
    messageId: string,
  ) {
    const client = this.supabaseDataService.forUser(accessToken);
    const userId = await requireUserId(client);
    const memberId = await getCurrentMemberId(client, userId);
    if (!memberId) {
      throw new BadRequestException(
        'Aucun profil membre lie au compte courant.',
      );
    }

    await this.ensureMessageExists(client, conversationId, messageId);

    const existingLike = await client
      .from('message_like')
      .select('id')
      .eq('message_id', messageId)
      .eq('member_id', memberId)
      .eq('reaction', 'like')
      .maybeSingle();

    if (existingLike.error) {
      if (this.isMissingSocialMessageModelError(existingLike.error)) {
        throw new BadRequestException(
          'Schema message social non a jour. Executez sql/2026-02-25_message_social_features.sql.',
        );
      }
      throw existingLike.error;
    }

    let liked = false;
    if (existingLike.data?.id) {
      const { error: unlikeError } = await client
        .from('message_like')
        .delete()
        .eq('id', existingLike.data.id);
      if (unlikeError) {
        if (this.isMissingSocialMessageModelError(unlikeError)) {
          throw new BadRequestException(
            'Schema message social non a jour. Executez sql/2026-02-25_message_social_features.sql.',
          );
        }
        throw unlikeError;
      }
      liked = false;
    } else {
      const { error: likeError } = await client.from('message_like').insert({
        member_id: memberId,
        message_id: messageId,
        reaction: 'like',
      });
      if (likeError) {
        if (this.isMissingSocialMessageModelError(likeError)) {
          throw new BadRequestException(
            'Schema message social non a jour. Executez sql/2026-02-25_message_social_features.sql.',
          );
        }
        throw likeError;
      }
      liked = true;
    }

    const { count, error: countError } = await client
      .from('message_like')
      .select('id', { count: 'exact', head: true })
      .eq('message_id', messageId)
      .eq('reaction', 'like');

    if (countError) {
      if (this.isMissingSocialMessageModelError(countError)) {
        throw new BadRequestException(
          'Schema message social non a jour. Executez sql/2026-02-25_message_social_features.sql.',
        );
      }
      throw countError;
    }

    return {
      liked,
      like_count: count ?? 0,
      message: liked ? 'Message aime.' : 'Like retire.',
    };
  }

  async deleteMessage(
    accessToken: string,
    conversationId: string,
    messageId: string,
  ) {
    const client = this.supabaseDataService.forUser(accessToken);
    await requireUserId(client);
    await this.ensureMessageExists(client, conversationId, messageId);

    const { data, error } = await client
      .from('message')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('id', messageId)
      .select('id')
      .maybeSingle();

    if (error) {
      if (this.isMissingSocialMessageModelError(error)) {
        throw new BadRequestException(
          'Schema message social non a jour. Executez sql/2026-02-25_message_social_features.sql.',
        );
      }
      if (error.code === '42501') {
        throw new ForbiddenException(
          'Permission insuffisante pour supprimer ce message.',
        );
      }
      throw error;
    }
    if (!data) {
      throw new ForbiddenException(
        'Permission insuffisante pour supprimer ce message.',
      );
    }

    return {
      deleted: true,
      message: 'Message supprime.',
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

  private isMissingSocialMessageModelError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const value = error as Partial<PostgrestError>;
    const code = value.code ?? '';
    const message = value.message ?? '';

    if (
      code === '42703' &&
      (message.includes('parent_message_id') ||
        message.includes('mention_member_ids') ||
        message.includes('edited_at'))
    ) {
      return true;
    }

    return code === '42P01' && message.includes('message_like');
  }

  private isMissingUnreadTrackingModelError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const value = error as Partial<PostgrestError>;
    const code = value.code ?? '';
    const message = value.message ?? '';

    if (code === '42703' && message.includes('last_read_at')) {
      return true;
    }

    return (
      code === '42883' &&
      (message.includes('mark_conversation_read') ||
        message.includes('unread_direct_counts'))
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

  private normalizeMentionMemberIds(values: string[] | undefined): string[] {
    const cleaned = (values ?? [])
      .map((value) => value.trim())
      .filter((value) => Boolean(value));

    return Array.from(new Set(cleaned)).slice(0, 30);
  }

  private async ensureParentMessage(
    client: ReturnType<SupabaseDataService['forUser']>,
    conversationId: string,
    parentMessageId: string | null,
    errorMessage: string,
  ) {
    if (!parentMessageId) {
      return;
    }

    const { data, error } = await client
      .from('message')
      .select('id, conversation_id, deleted_at')
      .eq('id', parentMessageId)
      .maybeSingle();

    if (error) {
      if (this.isMissingSocialMessageModelError(error)) {
        throw new BadRequestException(
          'Schema message social non a jour. Executez sql/2026-02-25_message_social_features.sql.',
        );
      }
      throw error;
    }

    if (
      !data ||
      data.conversation_id !== conversationId ||
      data.deleted_at !== null
    ) {
      throw new BadRequestException(errorMessage);
    }
  }

  private async ensureMessageExists(
    client: ReturnType<SupabaseDataService['forUser']>,
    conversationId: string,
    messageId: string,
  ) {
    const { data, error } = await client
      .from('message')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('id', messageId)
      .maybeSingle();

    if (error) {
      if (this.isMissingSocialMessageModelError(error)) {
        throw new BadRequestException(
          'Schema message social non a jour. Executez sql/2026-02-25_message_social_features.sql.',
        );
      }
      throw error;
    }
    if (!data) {
      throw new NotFoundException('Message introuvable.');
    }
  }

  private async loadMessageLikeStats(
    client: ReturnType<SupabaseDataService['forUser']>,
    messageIds: string[],
    currentMemberId: string | null,
  ): Promise<{
    countByMessage: Map<string, number>;
    likedByMessage: Set<string>;
  }> {
    if (!messageIds.length) {
      return {
        countByMessage: new Map<string, number>(),
        likedByMessage: new Set<string>(),
      };
    }

    const { data, error } = await client
      .from('message_like')
      .select('message_id, member_id, reaction')
      .in('message_id', messageIds)
      .eq('reaction', 'like');

    if (error) {
      if (this.isMissingSocialMessageModelError(error)) {
        throw new BadRequestException(
          'Schema message social non a jour. Executez sql/2026-02-25_message_social_features.sql.',
        );
      }
      throw error;
    }

    const rows = (data ?? []) as MessageLikeRow[];
    const countByMessage = new Map<string, number>();
    const likedByMessage = new Set<string>();

    for (const row of rows) {
      countByMessage.set(
        row.message_id,
        (countByMessage.get(row.message_id) ?? 0) + 1,
      );
      if (currentMemberId && row.member_id === currentMemberId) {
        likedByMessage.add(row.message_id);
      }
    }

    return { countByMessage, likedByMessage };
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

  private async resolveCanManageCommunication(
    client: ReturnType<SupabaseDataService['forUser']>,
  ): Promise<boolean> {
    const { data, error } = await client.rpc('is_communication_manager');
    if (error) {
      return false;
    }
    const value: unknown = data;
    if (typeof value === 'boolean') {
      return value;
    }
    if (Array.isArray(value)) {
      const rows = value as unknown[];
      if (!rows.length) {
        return false;
      }
      const firstRow: unknown = rows[0];
      if (typeof firstRow === 'boolean') {
        return firstRow;
      }
      if (
        firstRow &&
        typeof firstRow === 'object' &&
        !Array.isArray(firstRow)
      ) {
        const firstValue = this.firstRecordValue(
          firstRow as Record<string, unknown>,
        );
        return Boolean(firstValue);
      }
      return Boolean(firstRow);
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const firstValue = this.firstRecordValue(
        value as Record<string, unknown>,
      );
      return Boolean(firstValue);
    }
    return Boolean(value);
  }

  private async markConversationAsRead(
    client: ReturnType<SupabaseDataService['forUser']>,
    conversationId: string,
  ): Promise<void> {
    const { error } = await client.rpc('mark_conversation_read', {
      conversation_uuid: conversationId,
    });
    if (!error) {
      return;
    }
    if (this.isMissingUnreadTrackingModelError(error)) {
      throw new BadRequestException(
        'Schema unread non a jour. Executez sql/2026-02-25_direct_message_unread.sql.',
      );
    }
  }

  private async loadUnreadCounts(
    client: ReturnType<SupabaseDataService['forUser']>,
    conversationIds: string[],
  ): Promise<Map<string, number>> {
    if (!conversationIds.length) {
      return new Map<string, number>();
    }

    const { data, error } = await client.rpc('unread_direct_counts', {
      conversation_ids: conversationIds,
    });
    if (error) {
      if (this.isMissingUnreadTrackingModelError(error)) {
        throw new BadRequestException(
          'Schema unread non a jour. Executez sql/2026-02-25_direct_message_unread.sql.',
        );
      }
      throw error;
    }

    const rows = Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
    const unreadMap = new Map<string, number>();
    for (const row of rows) {
      const rawConversationId = row.conversation_id;
      if (typeof rawConversationId !== 'string') {
        continue;
      }
      const conversationId = rawConversationId.trim();
      if (!conversationId) {
        continue;
      }
      const rawUnreadCount = row.unread_count;
      const unreadCount =
        typeof rawUnreadCount === 'number'
          ? rawUnreadCount
          : typeof rawUnreadCount === 'string'
            ? Number(rawUnreadCount)
            : 0;
      unreadMap.set(
        conversationId,
        Number.isFinite(unreadCount) && unreadCount > 0
          ? Math.floor(unreadCount)
          : 0,
      );
    }

    return unreadMap;
  }

  private firstRecordValue(record: Record<string, unknown>): unknown {
    const keys = Object.keys(record);
    if (!keys.length) {
      return null;
    }
    return record[keys[0]];
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
