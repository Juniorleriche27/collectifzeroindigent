import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

type MemberOnboardingRow = Database['public']['Tables']['member']['Row'];

@Injectable()
export class MembersService {
  constructor(
    private readonly supabaseDataService: SupabaseDataService,
    private readonly configService: ConfigService,
  ) {}
  private readonly allowedStatusFilters = new Set([
    'active',
    'pending',
    'rejected',
    'suspended',
  ]);
  private readonly allowedOnboardingReviewRoles = new Set([
    'admin',
    'ca',
    'cn',
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

  async getOnboardingReview(accessToken: string, memberId: string) {
    const client = this.supabaseDataService.forUser(accessToken);
    await this.assertOnboardingReviewRole(client);
    return this.loadOnboardingMember(client, memberId);
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

  async generateOnboardingAnalysis(accessToken: string, memberId: string) {
    const client = this.supabaseDataService.forUser(accessToken);
    await this.assertOnboardingReviewRole(client);
    const member = await this.loadOnboardingMember(client, memberId);
    const model =
      this.configService.get<string>('COHERE_MODEL')?.trim() ||
      'command-r-plus';
    const analysis = await this.requestMemberAnalysis({
      model,
      question: this.buildOnboardingAnalysisQuestion(member),
    });

    return {
      analysis,
      generated_at: new Date().toISOString(),
      model,
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

  private async assertOnboardingReviewRole(
    client: ReturnType<SupabaseDataService['forUser']>,
  ): Promise<string> {
    const actorUserId = await requireUserId(client);
    const actorRole = await getProfileRoleByUserId(client, actorUserId);

    if (!this.allowedOnboardingReviewRoles.has(actorRole)) {
      throw new ForbiddenException(
        'Acces reserve aux roles admin/ca/cn pour la fiche onboarding detaillee.',
      );
    }

    return actorRole;
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

  private async loadOnboardingMember(
    client: ReturnType<SupabaseDataService['forUser']>,
    memberId: string,
  ): Promise<MemberOnboardingRow> {
    const { data, error } = await client
      .from('member')
      .select('*')
      .eq('id', memberId)
      .maybeSingle();

    if (error) {
      throw error;
    }
    if (!data) {
      throw new BadRequestException('Membre introuvable ou non visible.');
    }

    return data as MemberOnboardingRow;
  }

  private buildOnboardingAnalysisQuestion(member: MemberOnboardingRow): string {
    const skillNames = this.extractSkillNames(member.skills);
    const lines = [
      'Analyse cette fiche onboarding CZI pour un responsable gouvernance.',
      `Identite: ${member.first_name ?? '-'} ${member.last_name ?? '-'} | sexe: ${member.gender ?? '-'} | naissance: ${member.birth_date ?? '-'} | tranche: ${member.age_range ?? '-'}`,
      `Contact et statut: telephone ${member.phone ?? '-'} | email ${member.email ?? '-'} | statut ${member.status ?? '-'}`,
      `Localisation: region ${member.region_id ?? '-'} | prefecture ${member.prefecture_id ?? '-'} | commune ${member.commune_id ?? '-'} | localite ${member.locality ?? '-'}`,
      `Profil CZI: join_mode ${member.join_mode ?? '-'} | cellule primaire ${member.cellule_primary ?? '-'} | cellule secondaire ${member.cellule_secondary ?? '-'} | organisation ${member.org_name ?? member.association_name ?? member.enterprise_name ?? '-'}`,
      `Parcours: education ${member.education_level ?? '-'} | occupation ${member.occupation_status ?? '-'} | profession ${member.profession_title ?? '-'}`,
      `Engagement: domaines ${this.joinList(member.engagement_domains)} | frequence ${member.engagement_frequency ?? '-'} | action recente ${member.engagement_recent_action ?? '-'}`,
      `Entrepreneuriat: stade ${member.business_stage ?? '-'} | secteur ${member.business_sector ?? '-'} | besoins ${this.joinList(member.business_needs)}`,
      `Organisation: role ${member.org_role ?? '-'} | nom declare ${member.org_name_declared ?? '-'} | type ${member.org_type ?? '-'}`,
      `Competences: libres ${this.joinList(skillNames)} | tags ${this.joinList(member.skills_tags)} | interets libres ${this.joinList(member.interests)} | tags interets ${this.joinList(member.interests_tags)} | ODD ${this.joinList((member.odd_priorities ?? []).map((value) => String(value)))}`,
      `Objectif et besoins: objectif ${member.goal_3_6_months ?? '-'} | supports ${this.joinList(member.support_types)} | disponibilite ${member.availability ?? '-'} | contact prefere ${member.contact_preference ?? '-'} | besoin partenaire ${member.partner_request ? 'oui' : 'non'}`,
      `Situation socio-economique: revenu ${member.income_range ?? '-'} | stabilite ${member.income_stability ?? '-'} | charges ${member.dependents_count ?? '-'} | logement ${member.housing_status ?? '-'} | nourriture ${member.food_security ?? '-'} | sante ${member.health_access ?? '-'} | epargne ${member.savings_level ?? '-'} | dette ${member.debt_level ?? '-'} | recherche emploi ${member.employment_duration_if_searching ?? '-'} | besoins urgents ${this.joinList(member.urgent_needs)} | choc recent ${member.recent_shock ?? '-'} | limitation ${member.disability_or_limitation ? 'oui' : 'non'}`,
      `Indigence: score ${member.indigence_score ?? '-'} / 100 | niveau ${member.indigence_level ?? '-'} | facteurs ${this.joinList(member.indigence_factors)}`,
      'Donne une interpretation breve en francais simple pour admin/ca/cn: niveau de vulnerabilite, principaux risques, points d appui, et priorite d accompagnement. Maximum 120 mots, sans markdown.',
    ];

    return lines.join('\n');
  }

  private extractSkillNames(
    skills: Database['public']['Tables']['member']['Row']['skills'],
  ): string[] {
    if (!Array.isArray(skills)) {
      return [];
    }

    return Array.from(
      new Set(
        skills
          .map((item) => {
            if (!item || typeof item !== 'object') {
              return '';
            }
            const name = (item as { name?: unknown }).name;
            return typeof name === 'string' ? name.trim() : '';
          })
          .filter(Boolean),
      ),
    );
  }

  private joinList(
    values: Array<string | null | undefined> | null | undefined,
  ): string {
    const normalized = (values ?? [])
      .map((value) => String(value ?? '').trim())
      .filter(Boolean);

    return normalized.length > 0 ? normalized.join(', ') : '-';
  }

  private async requestMemberAnalysis(args: {
    model: string;
    question: string;
  }): Promise<string> {
    const apiKey = this.configService.get<string>('COHERE_API_KEY')?.trim();
    if (!apiKey) {
      throw new BadRequestException(
        'COHERE_API_KEY manquant. Configurez la cle API Cohere dans le backend.',
      );
    }

    const response = await fetch('https://api.cohere.ai/v1/chat', {
      body: JSON.stringify({
        max_tokens: this.readCohereMaxTokens(),
        message: args.question,
        model: args.model,
        preamble: this.memberAnalysisSystemPrompt(),
        temperature: 0.2,
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    const rawBody = await response.text();
    if (!response.ok) {
      throw new BadRequestException(
        this.extractCohereError(rawBody, response.status) ||
          'Erreur Cohere. Reessayez dans quelques instants.',
      );
    }

    let parsed: unknown = null;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      parsed = null;
    }

    const answer = this.extractCohereAnswer(parsed).trim();
    if (!answer) {
      throw new BadRequestException(
        'Reponse vide de l analyse IA. Reessayez dans quelques instants.',
      );
    }

    return this.normalizeMemberAnalysis(answer);
  }

  private extractCohereAnswer(payload: unknown): string {
    if (!payload || typeof payload !== 'object') {
      return '';
    }

    const candidate = payload as {
      message?: unknown;
      text?: unknown;
    };

    if (typeof candidate.text === 'string') {
      return candidate.text;
    }

    if (candidate.message && typeof candidate.message === 'object') {
      const content = (candidate.message as { content?: unknown }).content;
      if (Array.isArray(content)) {
        const textParts = content
          .map((part) => {
            if (!(typeof part === 'object' && part && 'text' in part)) {
              return '';
            }
            const rawText = (part as { text?: unknown }).text;
            return typeof rawText === 'string' ? rawText : '';
          })
          .filter(Boolean);
        if (textParts.length > 0) {
          return textParts.join('\n');
        }
      }
    }

    return '';
  }

  private extractCohereError(rawBody: string, status: number): string {
    if (!rawBody) {
      return `Cohere: HTTP ${status}`;
    }

    try {
      const parsed = JSON.parse(rawBody) as { message?: unknown };
      if (typeof parsed.message === 'string' && parsed.message.trim()) {
        return parsed.message.trim();
      }
    } catch {
      // Ignore parse error.
    }

    return rawBody.slice(0, 260);
  }

  private memberAnalysisSystemPrompt(): string {
    return [
      'Tu es l assistant IA d analyse des fiches onboarding CZI.',
      'Tu aides uniquement les roles admin, ca et cn a lire rapidement une situation membre.',
      'Tu analyses la vulnerabilite socio-economique, les points d appui, et la priorite d accompagnement.',
      'Format obligatoire: un seul paragraphe, 4 a 6 phrases, maximum 120 mots.',
      'Style attendu: francais clair, professionnel, direct, sans markdown, sans liste, sans titres.',
      'Ne jamais inventer une information absente.',
      'Si les donnees sont insuffisantes, le dire explicitement.',
    ].join('\n');
  }

  private normalizeMemberAnalysis(rawAnswer: string): string {
    const normalized = rawAnswer
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/[*_`#>]/g, ' ')
      .replace(/^\s*[-+•]\s+/gm, ' ')
      .replace(/^\s*\d+[.)-]\s+/gm, ' ')
      .replace(/\s*\n+\s*/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (!normalized) {
      return '';
    }

    const words = normalized.split(/\s+/).filter(Boolean);
    if (words.length <= 140) {
      return normalized;
    }

    return `${words.slice(0, 140).join(' ')}...`;
  }

  private readCohereMaxTokens(): number {
    const raw =
      this.configService.get<string>('SUPPORT_AI_MAX_TOKENS')?.trim() ?? '';
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 220;
    }

    return Math.min(parsed, 260);
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
