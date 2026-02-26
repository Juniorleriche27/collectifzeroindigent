import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { PostgrestError } from '@supabase/supabase-js';

import {
  getProfileRoleByUserId,
  getCurrentMemberId,
  requireUserId,
} from '../common/supabase-auth-context';
import type { Database } from '../infra/database.types';
import { SupabaseDataService } from '../infra/supabase-data.service';
import { LogMemberContactActionDto } from './dto/log-member-contact-action.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { ValidateMemberDto } from './dto/validate-member.dto';

type ListMembersQuery = {
  commune_id?: string;
  organisation_id?: string;
  page?: string;
  page_size?: string;
  prefecture_id?: string;
  q?: string;
  region_id?: string;
  sort?: string;
  status?: string;
};

@Injectable()
export class MembersService {
  constructor(private readonly supabaseDataService: SupabaseDataService) {}
  private readonly allowedStatusFilters = new Set([
    'active',
    'pending',
    'rejected',
    'suspended',
  ]);
  private readonly allowedValidationRoles = new Set([
    'admin',
    'ca',
    'cn',
    'pf',
  ]);
  private readonly memberSelectFields =
    'id, user_id, first_name, last_name, phone, email, status, region_id, prefecture_id, commune_id, join_mode, organisation_id, org_name, cellule_primary, cellule_secondary, validated_by, validated_at, validation_reason, created_at, updated_at';

  async list(accessToken: string, query: ListMembersQuery) {
    const client = this.supabaseDataService.forUser(accessToken);
    const page = this.positiveInt(query.page, 1);
    const pageSize = this.positiveInt(query.page_size, 10, 50);
    const rangeFrom = (page - 1) * pageSize;
    const rangeTo = rangeFrom + pageSize - 1;

    let dbQuery = client
      .from('member')
      .select(this.memberSelectFields, { count: 'exact' })
      .range(rangeFrom, rangeTo);

    const sort = query.sort ?? 'created_desc';
    if (sort === 'name_asc') {
      dbQuery = dbQuery
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true });
    } else if (sort === 'name_desc') {
      dbQuery = dbQuery
        .order('last_name', { ascending: false })
        .order('first_name', { ascending: false });
    } else if (sort === 'created_asc') {
      dbQuery = dbQuery.order('created_at', { ascending: true });
    } else if (sort === 'status_asc') {
      dbQuery = dbQuery
        .order('status', { ascending: true })
        .order('created_at', { ascending: false });
    } else {
      dbQuery = dbQuery.order('created_at', { ascending: false });
    }

    if (query.status && this.allowedStatusFilters.has(query.status)) {
      dbQuery = dbQuery.eq('status', query.status);
    }
    if (query.region_id) dbQuery = dbQuery.eq('region_id', query.region_id);
    if (query.prefecture_id)
      dbQuery = dbQuery.eq('prefecture_id', query.prefecture_id);
    if (query.commune_id) dbQuery = dbQuery.eq('commune_id', query.commune_id);
    if (query.organisation_id)
      dbQuery = dbQuery.eq('organisation_id', query.organisation_id);
    if (query.q) {
      const safeSearch = query.q.replaceAll(',', ' ').trim();
      if (safeSearch) {
        dbQuery = dbQuery.or(
          `first_name.ilike.%${safeSearch}%,last_name.ilike.%${safeSearch}%,phone.ilike.%${safeSearch}%,email.ilike.%${safeSearch}%`,
        );
      }
    }

    const { data, error, count } = await dbQuery;
    if (error) {
      throw error;
    }

    return {
      count: count ?? 0,
      page,
      pageSize,
      rows: data ?? [],
    };
  }

  async getById(accessToken: string, memberId: string) {
    const client = this.supabaseDataService.forUser(accessToken);
    const { data, error } = await client
      .from('member')
      .select(this.memberSelectFields)
      .eq('id', memberId)
      .maybeSingle();

    if (error) {
      throw error;
    }
    return data;
  }

  async getCurrent(accessToken: string) {
    const client = this.supabaseDataService.forUser(accessToken);
    const userId = await this.getCurrentUserId(accessToken);

    const { data, error } = await client
      .from('member')
      .select(this.memberSelectFields)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }

  async update(
    accessToken: string,
    memberId: string,
    payload: UpdateMemberDto,
  ) {
    const client = this.supabaseDataService.forUser(accessToken);
    const normalizedPayload = {
      ...payload,
      email: payload.email || null,
      organisation_id:
        payload.join_mode && payload.join_mode === 'personal'
          ? null
          : (payload.organisation_id ?? null),
      org_name:
        payload.join_mode && payload.join_mode === 'personal'
          ? null
          : (payload.org_name ?? null),
    };

    const { data, error } = await client
      .from('member')
      .update(normalizedPayload)
      .eq('id', memberId)
      .select(this.memberSelectFields)
      .maybeSingle();

    if (error) {
      throw error;
    }
    return data;
  }

  async updateCurrent(accessToken: string, payload: UpdateMemberDto) {
    const client = this.supabaseDataService.forUser(accessToken);
    const userId = await this.getCurrentUserId(accessToken);
    const normalizedPayload = {
      ...payload,
      email: payload.email || null,
      organisation_id:
        payload.join_mode && payload.join_mode === 'personal'
          ? null
          : (payload.organisation_id ?? null),
      org_name:
        payload.join_mode && payload.join_mode === 'personal'
          ? null
          : (payload.org_name ?? null),
    };

    const { data, error } = await client
      .from('member')
      .update(normalizedPayload)
      .eq('user_id', userId)
      .select(this.memberSelectFields)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }

  async validate(
    accessToken: string,
    memberId: string,
    payload: ValidateMemberDto,
  ) {
    const client = this.supabaseDataService.forUser(accessToken);
    const actorUserId = await requireUserId(client);
    const actorRole = await getProfileRoleByUserId(client, actorUserId);

    if (!this.allowedValidationRoles.has(actorRole)) {
      throw new ForbiddenException(
        'Validation reservee aux roles admin/ca/cn/pf.',
      );
    }

    const reason = payload.reason?.trim() ?? '';
    if (payload.decision === 'reject' && !reason) {
      throw new BadRequestException('Un motif est obligatoire pour un rejet.');
    }

    const { data: member, error: memberError } = await client
      .from('member')
      .select('id, status, region_id, cellule_primary, cellule_secondary')
      .eq('id', memberId)
      .maybeSingle();

    if (memberError) {
      throw memberError;
    }
    if (!member) {
      throw new BadRequestException('Membre introuvable ou non visible.');
    }

    if (actorRole === 'pf') {
      const actorRegionId = await this.getCurrentMemberRegionId(
        client,
        actorUserId,
      );
      if (!actorRegionId || actorRegionId !== member.region_id) {
        throw new ForbiddenException(
          'Le role PF ne peut valider que les membres de sa propre region.',
        );
      }
    }

    if (this.normalizeStatus(member.status) !== 'pending') {
      throw new BadRequestException(
        'Seuls les membres en statut pending peuvent etre valides.',
      );
    }

    const nextPrimary =
      payload.cellule_primary ?? member.cellule_primary ?? null;
    const nextSecondary =
      payload.cellule_secondary !== undefined
        ? payload.cellule_secondary
        : (member.cellule_secondary ?? null);

    if (nextPrimary && nextSecondary && nextPrimary === nextSecondary) {
      throw new BadRequestException(
        'La cellule secondaire doit etre differente de la cellule primaire.',
      );
    }

    const updatePayload: Database['public']['Tables']['member']['Update'] = {
      status: payload.decision === 'approve' ? 'active' : 'rejected',
      validated_at: new Date().toISOString(),
      validated_by: actorUserId,
      validation_reason: reason || null,
    };

    if (payload.cellule_primary) {
      updatePayload.cellule_primary = payload.cellule_primary;
    }
    if (payload.cellule_secondary !== undefined) {
      updatePayload.cellule_secondary = payload.cellule_secondary;
    }

    const { data, error } = await client
      .from('member')
      .update(updatePayload)
      .eq('id', memberId)
      .select(this.memberSelectFields)
      .maybeSingle();

    if (error) {
      throw this.mapMemberValidationError(error);
    }

    return {
      member: data,
      message:
        payload.decision === 'approve'
          ? 'Membre valide et active.'
          : 'Membre rejete.',
    };
  }

  async logContactAction(
    accessToken: string,
    payload: LogMemberContactActionDto,
  ) {
    const client = this.supabaseDataService.forUser(accessToken);
    const actorUserId = await requireUserId(client);
    const actorMemberId = await getCurrentMemberId(client, actorUserId);

    const { data: targetMember, error: targetError } = await client
      .from('member')
      .select('id, email, phone')
      .eq('id', payload.member_id)
      .maybeSingle();

    if (targetError) {
      throw targetError;
    }
    if (!targetMember) {
      throw new BadRequestException('Membre cible introuvable ou non visible.');
    }

    const channel = payload.channel;
    const targetEmail = targetMember.email?.trim() ?? null;
    const targetPhone = targetMember.phone?.trim() ?? null;

    if (channel === 'email' && !targetEmail) {
      throw new BadRequestException('Aucun email disponible pour ce membre.');
    }
    if (channel === 'phone' && !targetPhone) {
      throw new BadRequestException('Aucun numero de telephone disponible.');
    }

    const source = payload.source?.trim() || 'unknown';

    const { error: insertError } = await client
      .from('member_contact_action')
      .insert({
        actor_member_id: actorMemberId,
        actor_user_id: actorUserId,
        channel,
        source,
        target_email: channel === 'email' ? targetEmail : null,
        target_member_id: targetMember.id,
        target_phone: channel === 'phone' ? targetPhone : null,
      });

    if (insertError) {
      if (insertError.code === '42P01') {
        return {
          logged: false,
          message:
            'Table audit manquante. Executez sql/2026-02-25_member_contact_action_audit.sql.',
        };
      }
      throw insertError;
    }

    return {
      logged: true,
      message: 'Action de contact enregistree.',
    };
  }

  private positiveInt(
    value: string | undefined,
    fallback: number,
    max = 1000,
  ): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 1) return fallback;
    return Math.min(Math.floor(parsed), max);
  }

  private async getCurrentUserId(accessToken: string): Promise<string> {
    const client = this.supabaseDataService.forUser(accessToken);
    const {
      data: { user },
      error,
    } = await client.auth.getUser();

    if (error || !user) {
      throw new UnauthorizedException('Invalid authenticated session.');
    }

    return user.id;
  }

  private normalizeStatus(status: string | null | undefined): string {
    return (status ?? '').trim().toLowerCase();
  }

  private async getCurrentMemberRegionId(
    client: ReturnType<SupabaseDataService['forUser']>,
    userId: string,
  ): Promise<string | null> {
    const { data, error } = await client
      .from('member')
      .select('region_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data?.region_id ?? null;
  }

  private mapMemberValidationError(error: PostgrestError): Error {
    const sqlMessage = (error.message ?? '').trim();
    const sqlDetails = (error.details ?? '').trim();
    const sqlHint = (error.hint ?? '').trim();

    if (
      error.code === '23514' &&
      /member_active_profile_requirements_check/i.test(error.message)
    ) {
      return new BadRequestException(
        "La contrainte d'approbation onboarding est encore active. Executez sql/2026-02-26_remove_member_active_profile_requirements_check.sql puis reessayez.",
      );
    }

    if (
      error.code === '23514' &&
      /member_cellule_secondary_distinct_check/i.test(error.message)
    ) {
      return new BadRequestException(
        'La cellule secondaire doit etre differente de la cellule primaire.',
      );
    }

    if (error.code === '42501') {
      return new ForbiddenException(
        'Permission RLS insuffisante pour valider ce membre. Verifiez les policies member_update_by_role et le role courant.',
      );
    }

    if (error.code === '42703') {
      return new BadRequestException(
        `Schema SQL incomplet pour validation membre (${sqlMessage || 'colonne manquante'}). Reexecutez le pack SQL de livraison.`,
      );
    }

    if (error.code === '23503') {
      return new BadRequestException(
        `Reference invalide pendant validation membre: ${sqlMessage || 'cle etrangere'}${sqlDetails ? ` (${sqlDetails})` : ''}.`,
      );
    }

    const fallback = [
      sqlMessage || 'Erreur SQL pendant validation membre.',
      sqlDetails,
      sqlHint ? `hint: ${sqlHint}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    return new BadRequestException(fallback);
  }
}
