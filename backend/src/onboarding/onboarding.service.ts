import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { SupabaseDataService } from '../infra/supabase-data.service';
import { CreateOnboardingDto } from './dto/create-onboarding.dto';

type ResolvedOrganisation = {
  id: string;
  name: string;
};

type CellulePrimary = 'engaged' | 'entrepreneur' | 'org_leader';
type OrganisationJoinMode = 'association' | 'enterprise';

type SkillPayload = {
  level?: string;
  name?: string;
};

type NormalizedOnboardingData = {
  ageRange: string | null;
  availability: string | null;
  birthDate: string | null;
  businessNeeds: string[] | null;
  businessSector: string | null;
  businessStage: string | null;
  contactPreference: 'whatsapp' | 'email' | 'call' | null;
  educationLevel: string | null;
  engagementDomains: string[] | null;
  engagementFrequency: string | null;
  engagementRecentAction: string | null;
  goalShortTerm: string | null;
  interests: string[] | null;
  locality: string | null;
  mobilityZones: string | null;
  occupationStatus: string | null;
  oddPriorities: number[] | null;
  orgNameDeclared: string | null;
  orgRole: string | null;
  professionTitle: string | null;
  skills: Array<{ level: string; name: string }> | null;
  supportTypes: string[] | null;
};

@Injectable()
export class OnboardingService {
  constructor(private readonly supabaseDataService: SupabaseDataService) {}

  async create(accessToken: string, payload: CreateOnboardingDto) {
    const client = this.supabaseDataService.forUser(accessToken);

    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();

    if (userError || !user) {
      throw new UnauthorizedException('Invalid authenticated session.');
    }

    const normalizedOrgName = this.normalizeString(payload.org_name);
    const cellulePrimary = this.resolveCellulePrimary(
      payload.join_mode,
      payload.cellule_primary,
    );
    const organisationJoinMode = this.resolveOrganisationJoinMode(
      payload.join_mode,
      payload.partner_request,
      payload.org_type,
    );
    const normalizedData = this.normalizeOnboardingData(payload);

    this.ensureOnboardingRequirements({
      cellulePrimary,
      consentTerms: payload.consent_terms ?? false,
      joinMode: payload.join_mode,
      normalizedData,
      organisationJoinMode,
      partnerRequest: payload.partner_request ?? false,
      resolvedOrgName: normalizedOrgName,
    });

    const resolvedOrganisation = await this.resolveOrganisation(
      client,
      user.id,
      organisationJoinMode,
      payload.organisation_id ?? null,
      normalizedOrgName,
    );

    const finalOrgName = resolvedOrganisation?.name ?? normalizedOrgName;
    const finalOrgNameDeclared =
      normalizedData.orgNameDeclared ??
      (cellulePrimary === 'org_leader' ? finalOrgName : null);

    const { data: existingMember, error: existingMemberError } = await client
      .from('member')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingMemberError) {
      throw existingMemberError;
    }

    if (existingMember) {
      return {
        member_id: existingMember.id,
        message: 'Member already exists.',
      };
    }

    const { data: member, error: createMemberError } = await client
      .from('member')
      .insert({
        age_range: normalizedData.ageRange,
        association_name:
          payload.join_mode === 'association' ? finalOrgName : null,
        availability: normalizedData.availability,
        birth_date: normalizedData.birthDate,
        business_needs: normalizedData.businessNeeds,
        business_sector: normalizedData.businessSector,
        business_stage: normalizedData.businessStage,
        cellule_primary: cellulePrimary,
        cellule_secondary: payload.cellule_secondary ?? null,
        commune_id: payload.commune_id,
        consent_ai_training_agg: payload.consent_ai_training_agg ?? false,
        consent_analytics: payload.consent_analytics ?? false,
        consent_terms: payload.consent_terms ?? false,
        contact_preference: normalizedData.contactPreference,
        education_level: normalizedData.educationLevel,
        email: payload.email || null,
        engagement_domains: normalizedData.engagementDomains,
        engagement_frequency: normalizedData.engagementFrequency,
        engagement_recent_action: normalizedData.engagementRecentAction,
        enterprise_name:
          payload.join_mode === 'enterprise' ? finalOrgName : null,
        first_name: payload.first_name,
        gender: this.normalizeString(payload.gender),
        goal_3_6_months: normalizedData.goalShortTerm,
        interests: normalizedData.interests,
        join_mode: payload.join_mode,
        last_name: payload.last_name,
        locality: normalizedData.locality,
        mobility: payload.mobility ?? null,
        mobility_zones: normalizedData.mobilityZones,
        odd_priorities: normalizedData.oddPriorities,
        organisation_id: resolvedOrganisation?.id ?? null,
        org_name: organisationJoinMode ? finalOrgName : null,
        org_name_declared: finalOrgNameDeclared,
        org_role: normalizedData.orgRole,
        org_type: organisationJoinMode ?? null,
        partner_request: payload.partner_request ?? false,
        phone: payload.phone,
        prefecture_id: payload.prefecture_id,
        profession_title: normalizedData.professionTitle,
        region_id: payload.region_id,
        skills: normalizedData.skills,
        support_types: normalizedData.supportTypes,
        user_id: user.id,
      })
      .select('id')
      .single();

    if (createMemberError || !member) {
      throw (
        createMemberError ?? new BadRequestException('Unable to create member.')
      );
    }

    const updatePayload = { member_id: member.id };

    let { error: updateProfileError } = await client
      .from('profile')
      .update(updatePayload)
      .eq('user_id', user.id);

    if (updateProfileError?.code === '42703') {
      const fallbackUpdate = await client
        .from('profile')
        .update(updatePayload)
        .eq('id', user.id);
      updateProfileError = fallbackUpdate.error;
    }

    if (updateProfileError) throw updateProfileError;

    return {
      member_id: member.id,
      message: 'Onboarding completed.',
    };
  }

  private resolveCellulePrimary(
    joinMode: string,
    cellulePrimary?: CellulePrimary,
  ): CellulePrimary {
    if (cellulePrimary) {
      return cellulePrimary;
    }

    if (joinMode === 'enterprise') {
      return 'entrepreneur';
    }

    if (joinMode === 'association') {
      return 'org_leader';
    }

    return 'engaged';
  }

  private resolveOrganisationJoinMode(
    joinMode: string,
    partnerRequest?: boolean,
    orgType?: string,
  ): OrganisationJoinMode | null {
    if (joinMode === 'association' || joinMode === 'enterprise') {
      return joinMode;
    }

    if (
      partnerRequest &&
      (orgType === 'association' || orgType === 'enterprise')
    ) {
      return orgType;
    }

    return null;
  }

  private async resolveOrganisation(
    client: ReturnType<SupabaseDataService['forUser']>,
    userId: string,
    organisationJoinMode: OrganisationJoinMode | null,
    organisationId: string | null,
    orgName: string | null,
  ): Promise<ResolvedOrganisation | null> {
    if (!organisationJoinMode) {
      return null;
    }

    if (organisationId) {
      const { data, error } = await client
        .from('organisation')
        .select('id, name, type')
        .eq('id', organisationId)
        .maybeSingle();

      if (error) {
        throw error;
      }
      if (!data) {
        throw new BadRequestException('Organisation selectionnee introuvable.');
      }
      this.assertOrganisationType(data.type, organisationJoinMode);
      return {
        id: data.id,
        name: data.name,
      };
    }

    if (!orgName) {
      throw new BadRequestException(
        "Le nom de l'organisation est obligatoire pour ce profil.",
      );
    }

    const { data: existingOrganisation, error: existingOrganisationError } =
      await client
        .from('organisation')
        .select('id, name, type')
        .eq('name', orgName)
        .eq('type', organisationJoinMode)
        .maybeSingle();

    if (existingOrganisationError) {
      throw existingOrganisationError;
    }
    if (existingOrganisation) {
      return {
        id: existingOrganisation.id,
        name: existingOrganisation.name,
      };
    }

    const { data: createdOrganisation, error: createOrganisationError } =
      await client
        .from('organisation')
        .insert({
          created_by: userId,
          name: orgName,
          type: organisationJoinMode,
        })
        .select('id, name, type')
        .single();

    if (createOrganisationError) {
      if (createOrganisationError.code === '23505') {
        const { data: duplicateOrganisation, error: duplicateError } =
          await client
            .from('organisation')
            .select('id, name, type')
            .ilike('name', orgName)
            .eq('type', organisationJoinMode)
            .maybeSingle();

        if (duplicateError) {
          throw duplicateError;
        }
        if (duplicateOrganisation) {
          return {
            id: duplicateOrganisation.id,
            name: duplicateOrganisation.name,
          };
        }
      }

      throw createOrganisationError;
    }

    this.assertOrganisationType(createdOrganisation.type, organisationJoinMode);
    return {
      id: createdOrganisation.id,
      name: createdOrganisation.name,
    };
  }

  private assertOrganisationType(
    type: string,
    joinMode: OrganisationJoinMode,
  ): void {
    if (!type) return;
    if (type !== joinMode) {
      throw new BadRequestException(
        "Type organisation incompatible avec le type d'inscription.",
      );
    }
  }

  private normalizeString(value?: string | null): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  private normalizeStringArray(values?: string[] | null): string[] | null {
    if (!Array.isArray(values)) {
      return null;
    }

    const normalized = values
      .map((item) => this.normalizeString(item))
      .filter((item): item is string => Boolean(item));

    if (normalized.length === 0) {
      return null;
    }

    return Array.from(new Set(normalized));
  }

  private normalizeOddPriorities(values?: number[] | null): number[] | null {
    if (!Array.isArray(values)) {
      return null;
    }

    const allowed = new Set([1, 2, 3, 4, 5, 6, 8, 13, 16]);
    const normalized = values
      .map((item) => Number(item))
      .filter((item) => Number.isInteger(item) && allowed.has(item));

    if (normalized.length === 0) {
      return null;
    }

    return Array.from(new Set(normalized));
  }

  private normalizeSkills(
    values?: SkillPayload[] | null,
  ): Array<{ level: string; name: string }> | null {
    if (!Array.isArray(values)) {
      return null;
    }

    const normalized = values
      .map((skill) => ({
        level: this.normalizeString(skill?.level) ?? 'intermediate',
        name: this.normalizeString(skill?.name),
      }))
      .filter((skill): skill is { level: string; name: string } =>
        Boolean(skill.name),
      );

    return normalized.length > 0 ? normalized : null;
  }

  private normalizeOnboardingData(
    payload: CreateOnboardingDto,
  ): NormalizedOnboardingData {
    return {
      ageRange: this.normalizeString(payload.age_range),
      availability: this.normalizeString(payload.availability),
      birthDate: this.normalizeString(payload.birth_date),
      businessNeeds: this.normalizeStringArray(payload.business_needs),
      businessSector: this.normalizeString(payload.business_sector),
      businessStage: this.normalizeString(payload.business_stage),
      contactPreference: payload.contact_preference ?? null,
      educationLevel: this.normalizeString(payload.education_level),
      engagementDomains: this.normalizeStringArray(payload.engagement_domains),
      engagementFrequency: this.normalizeString(payload.engagement_frequency),
      engagementRecentAction: this.normalizeString(
        payload.engagement_recent_action,
      ),
      goalShortTerm: this.normalizeString(payload.goal_3_6_months),
      interests: this.normalizeStringArray(payload.interests),
      locality: this.normalizeString(payload.locality),
      mobilityZones: this.normalizeString(payload.mobility_zones),
      occupationStatus: this.normalizeString(payload.occupation_status),
      oddPriorities: this.normalizeOddPriorities(payload.odd_priorities),
      orgNameDeclared: this.normalizeString(payload.org_name_declared),
      orgRole: this.normalizeString(payload.org_role),
      professionTitle: this.normalizeString(payload.profession_title),
      skills: this.normalizeSkills(payload.skills),
      supportTypes: this.normalizeStringArray(payload.support_types),
    };
  }

  private ensureOnboardingRequirements(args: {
    cellulePrimary: CellulePrimary;
    consentTerms: boolean;
    joinMode: string;
    normalizedData: NormalizedOnboardingData;
    organisationJoinMode: OrganisationJoinMode | null;
    partnerRequest: boolean;
    resolvedOrgName: string | null;
  }): void {
    const {
      cellulePrimary,
      consentTerms,
      joinMode,
      normalizedData,
      organisationJoinMode,
      partnerRequest,
      resolvedOrgName,
    } = args;

    if (!normalizedData.educationLevel) {
      throw new BadRequestException('education_level est obligatoire.');
    }
    if (!normalizedData.occupationStatus) {
      throw new BadRequestException('occupation_status est obligatoire.');
    }
    if (!normalizedData.birthDate && !normalizedData.ageRange) {
      throw new BadRequestException('birth_date ou age_range est obligatoire.');
    }
    if (!normalizedData.contactPreference) {
      throw new BadRequestException('contact_preference est obligatoire.');
    }
    if (!normalizedData.goalShortTerm) {
      throw new BadRequestException('goal_3_6_months est obligatoire.');
    }
    if (!normalizedData.supportTypes?.length) {
      throw new BadRequestException('support_types est obligatoire.');
    }
    if (!normalizedData.skills?.length) {
      throw new BadRequestException('skills est obligatoire.');
    }
    if (!normalizedData.interests?.length) {
      throw new BadRequestException('interests est obligatoire.');
    }
    if (!normalizedData.oddPriorities?.length) {
      throw new BadRequestException('odd_priorities est obligatoire.');
    }
    if (normalizedData.oddPriorities.length > 3) {
      throw new BadRequestException('odd_priorities: maximum 3 ODD.');
    }
    if (!consentTerms) {
      throw new BadRequestException(
        'Le consentement aux conditions est obligatoire.',
      );
    }

    if (joinMode !== 'personal' && !resolvedOrgName) {
      throw new BadRequestException(
        "Le nom de l'association/entreprise est obligatoire.",
      );
    }

    if (partnerRequest && !organisationJoinMode) {
      throw new BadRequestException(
        'org_type est obligatoire quand partner_request est active.',
      );
    }

    if (partnerRequest && !resolvedOrgName) {
      throw new BadRequestException(
        'org_name est obligatoire quand partner_request est active.',
      );
    }

    if (cellulePrimary === 'engaged') {
      if (!normalizedData.engagementDomains?.length) {
        throw new BadRequestException(
          'engagement_domains est obligatoire pour la cellule engagee.',
        );
      }
      if (!normalizedData.engagementFrequency) {
        throw new BadRequestException(
          'engagement_frequency est obligatoire pour la cellule engagee.',
        );
      }
      if (!normalizedData.engagementRecentAction) {
        throw new BadRequestException(
          'engagement_recent_action est obligatoire pour la cellule engagee.',
        );
      }
      return;
    }

    if (cellulePrimary === 'entrepreneur') {
      if (!normalizedData.businessStage) {
        throw new BadRequestException(
          'business_stage est obligatoire pour la cellule entrepreneur.',
        );
      }
      if (!normalizedData.businessSector) {
        throw new BadRequestException(
          'business_sector est obligatoire pour la cellule entrepreneur.',
        );
      }
      if (!normalizedData.businessNeeds?.length) {
        throw new BadRequestException(
          'business_needs est obligatoire pour la cellule entrepreneur.',
        );
      }
      return;
    }

    if (!normalizedData.orgRole) {
      throw new BadRequestException(
        'org_role est obligatoire pour la cellule responsable organisation.',
      );
    }
    if (!normalizedData.orgNameDeclared && !resolvedOrgName) {
      throw new BadRequestException(
        'org_name_declared est obligatoire pour la cellule responsable organisation.',
      );
    }
  }
}
