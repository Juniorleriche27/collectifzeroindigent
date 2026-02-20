import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { SupabaseDataService } from '../infra/supabase-data.service';
import { CreateOnboardingDto } from './dto/create-onboarding.dto';

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

    if (payload.join_mode !== 'personal' && !payload.org_name) {
      throw new BadRequestException(
        'org_name is required for association/enterprise.',
      );
    }

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
        org_name:
          payload.join_mode === 'personal' ? null : (payload.org_name ?? null),
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

    const { error: updateProfileError } = await client
      .from('profile')
      .update({ member_id: member.id })
      .eq('user_id', user.id);

    if (updateProfileError) {
      throw updateProfileError;
    }

    return {
      member_id: member.id,
      message: 'Onboarding completed.',
    };
  }
}
