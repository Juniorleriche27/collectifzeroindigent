import {
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../infra/database.types';

type SupabaseLikeClient = SupabaseClient<Database>;

function isMissingUserIdColumn(error: PostgrestError | null): boolean {
  if (!error) return false;
  return error.code === '42703' && /user_id/i.test(error.message);
}

function normalizeRole(role: string | null | undefined): string {
  const value = (role ?? 'member').trim().toLowerCase();
  if (!value) return 'member';
  return value;
}

export async function requireUserId(
  client: SupabaseLikeClient,
): Promise<string> {
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) {
    throw new UnauthorizedException('Invalid authenticated session.');
  }

  return user.id;
}

export async function getProfileRoleByUserId(
  client: SupabaseLikeClient,
  userId: string,
): Promise<string> {
  const byUserId = await client
    .from('profile')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  if (!isMissingUserIdColumn(byUserId.error)) {
    if (byUserId.error) {
      throw byUserId.error;
    }
    return normalizeRole(byUserId.data?.role);
  }

  const byId = await client
    .from('profile')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (byId.error) {
    throw byId.error;
  }

  return normalizeRole(byId.data?.role);
}

export async function getCurrentMemberId(
  client: SupabaseLikeClient,
  userId: string,
): Promise<string | null> {
  const { data, error } = await client
    .from('member')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.id ?? null;
}

export async function isCommunicationManager(
  client: SupabaseLikeClient,
  userId: string,
  role: string,
): Promise<boolean> {
  if (role === 'admin' || role === 'ca') {
    return true;
  }

  const { data, error } = await client
    .from('communication_team')
    .select('can_publish, can_send_email')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data && (data.can_publish || data.can_send_email));
}

export async function assertCommunicationManager(
  client: SupabaseLikeClient,
): Promise<{
  memberId: string | null;
  role: string;
  userId: string;
}> {
  const userId = await requireUserId(client);
  const role = await getProfileRoleByUserId(client, userId);
  const manager = await isCommunicationManager(client, userId, role);
  if (!manager) {
    throw new ForbiddenException(
      'Acces reserve a admin/ca/equipe communication.',
    );
  }

  const memberId = await getCurrentMemberId(client, userId);
  return { memberId, role, userId };
}
