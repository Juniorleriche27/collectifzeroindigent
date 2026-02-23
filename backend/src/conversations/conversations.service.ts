import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';

import {
  assertCommunicationManager,
  getCurrentMemberId,
  requireUserId,
} from '../common/supabase-auth-context';
import { normalizeSingleScope, type ScopeInput } from '../common/scope.util';
import { SupabaseDataService } from '../infra/supabase-data.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';

type ConversationRow = {
  commune_id: string | null;
  conversation_type: 'community' | 'direct';
  created_at: string;
  created_by: string;
  id: string;
  prefecture_id: string | null;
  region_id: string | null;
  scope_type: 'all' | 'region' | 'prefecture' | 'commune';
  title: string | null;
  updated_at: string;
};

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
    'id, conversation_type, title, created_by, scope_type, region_id, prefecture_id, commune_id, created_at, updated_at';
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

    let dbQuery = client
      .from('conversation')
      .select(this.conversationSelect)
      .order('updated_at', { ascending: false })
      .limit(200);

    if (query.conversation_type === 'community' || query.conversation_type === 'direct') {
      dbQuery = dbQuery.eq('conversation_type', query.conversation_type);
    }

    const normalizedSearch = query.q?.replaceAll(',', ' ').trim() ?? '';
    if (normalizedSearch) {
      dbQuery = dbQuery.ilike('title', `%${normalizedSearch}%`);
    }

    const { data, error } = await dbQuery;
    if (error) {
      throw error;
    }

    const items = (data ?? []) as ConversationRow[];
    const ids = items.map((item) => item.id);
    const participants = await this.loadParticipants(client, ids);
    const latestMessages = await this.loadLatestMessages(client, ids);

    const result = items
      .map((item) => ({
        ...item,
        latest_message: latestMessages.get(item.id) ?? null,
        participants: participants.get(item.id) ?? [],
      }))
      .sort((first, second) => {
        const firstDate = first.latest_message?.created_at ?? first.updated_at ?? first.created_at;
        const secondDate =
          second.latest_message?.created_at ?? second.updated_at ?? second.created_at;
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

      const { data: conversation, error: createError } = await client
        .from('conversation')
        .insert({
          conversation_type: 'direct',
          created_by: userId,
          scope_type: 'all',
          title: payload.title?.trim() || null,
        })
        .select(this.conversationSelect)
        .single();

      if (createError || !conversation) {
        throw createError ?? new BadRequestException('Conversation directe invalide.');
      }

      const participantRows = [memberId, ...participantIds].map((participantMemberId) => ({
        can_post: true,
        conversation_id: conversation.id,
        member_id: participantMemberId,
      }));

      const { error: participantError } = await client
        .from('conversation_participant')
        .insert(participantRows);

      if (participantError) {
        await client.from('conversation').delete().eq('id', conversation.id);
        throw participantError;
      }

      return {
        item: {
          ...conversation,
          latest_message: null,
          participants: await this.loadConversationParticipants(
            client,
            conversation.id,
          ),
        },
        message: 'Conversation directe creee.',
      };
    }

    await assertCommunicationManager(client);
    const scope = normalizeSingleScope({
      commune_id: payload.commune_id ?? null,
      prefecture_id: payload.prefecture_id ?? null,
      region_id: payload.region_id ?? null,
      scope_type: (payload.scope_type ?? 'all') as ScopeInput['scope_type'],
    });

    const title = payload.title?.trim() ?? '';
    if (!title) {
      throw new BadRequestException(
        'Le titre est obligatoire pour une conversation communaute.',
      );
    }

    const { data: conversation, error } = await client
      .from('conversation')
      .insert({
        commune_id: scope.commune_id ?? null,
        conversation_type: 'community',
        created_by: userId,
        prefecture_id: scope.prefecture_id ?? null,
        region_id: scope.region_id ?? null,
        scope_type: scope.scope_type,
        title,
      })
      .select(this.conversationSelect)
      .single();

    if (error || !conversation) {
      throw error ?? new BadRequestException('Conversation communaute invalide.');
    }

    return {
      item: { ...conversation, latest_message: null, participants: [] },
      message: 'Conversation communaute creee.',
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
      return new Map<string, Array<ParticipantRow & { member: MemberLite | null }>>();
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
