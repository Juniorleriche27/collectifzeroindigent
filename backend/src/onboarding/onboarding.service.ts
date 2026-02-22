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

    const normalizedOrgName = payload.org_name?.trim() ?? '';
    const resolvedOrganisation = await this.resolveOrganisation(
      client,
      user.id,
      payload.join_mode,
      payload.organisation_id ?? null,
      normalizedOrgName,
    );

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
        commune_id: payload.commune_id,
        email: payload.email || null,
        first_name: payload.first_name,
        join_mode: payload.join_mode,
        last_name: payload.last_name,
        organisation_id: resolvedOrganisation?.id ?? null,
        org_name:
          payload.join_mode === 'personal' ? null : resolvedOrganisation?.name,
        phone: payload.phone,
        prefecture_id: payload.prefecture_id,
        region_id: payload.region_id,
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

  private async resolveOrganisation(
    client: ReturnType<SupabaseDataService['forUser']>,
    userId: string,
    joinMode: string,
    organisationId: string | null,
    orgName: string,
  ): Promise<ResolvedOrganisation | null> {
    if (joinMode === 'personal') {
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
      this.assertOrganisationType(data.type, joinMode);
      return {
        id: data.id,
        name: data.name,
      };
    }

    if (!orgName) {
      throw new BadRequestException(
        'org_name est requis pour association/enterprise.',
      );
    }

    const { data: existingOrganisation, error: existingOrganisationError } =
      await client
        .from('organisation')
        .select('id, name, type')
        .eq('name', orgName)
        .eq('type', joinMode)
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
          type: joinMode,
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
            .eq('type', joinMode)
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

    this.assertOrganisationType(createdOrganisation.type, joinMode);
    return {
      id: createdOrganisation.id,
      name: createdOrganisation.name,
    };
  }

  private assertOrganisationType(type: string, joinMode: string): void {
    if (!type) return;
    if (type !== joinMode) {
      throw new BadRequestException(
        "Type organisation incompatible avec le type d'inscription.",
      );
    }
  }
}
