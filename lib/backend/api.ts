import 'server-only';

import { createClient } from '@/lib/supabase/server';

export type RegionOption = {
  id: string;
  name: string;
};

export type PrefectureOption = {
  id: string;
  name: string;
  region_id: string;
};

export type CommuneOption = {
  id: string;
  name: string;
  prefecture_id: string;
};

export type MemberRecord = {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  status: string | null;
  region_id: string | null;
  prefecture_id: string | null;
  commune_id: string | null;
  join_mode: string | null;
  organisation_id: string | null;
  org_name: string | null;
  created_at?: string | null;
};

export type OrganisationCardItem = {
  id: string;
  name: string;
  category: string;
  members: number;
};

export type DashboardOverview = {
  active_members: number;
  pending_members: number;
  suspended_members: number;
  total_members: number;
  trend_new_this_month: number;
};

type BackendRequestOptions = RequestInit & {
  fallbackError?: string;
};

function backendApiBaseUrl(): string {
  const rawBaseUrl =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'http://127.0.0.1:4000';

  const baseUrl = rawBaseUrl.endsWith('/')
    ? rawBaseUrl.slice(0, -1)
    : rawBaseUrl;

  return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
}

function toErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const candidate = payload as { error?: unknown; message?: unknown };

  if (Array.isArray(candidate.message)) {
    const text = candidate.message
      .filter((item): item is string => typeof item === 'string')
      .join(' ')
      .trim();
    if (text) {
      return text;
    }
  }

  if (typeof candidate.message === 'string' && candidate.message.trim()) {
    return candidate.message.trim();
  }

  if (typeof candidate.error === 'string' && candidate.error.trim()) {
    return candidate.error.trim();
  }

  return fallback;
}

async function getAccessToken(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error('Session invalide. Reconnectez-vous.');
  }

  return session.access_token;
}

async function requestBackend<T>(
  path: string,
  options: BackendRequestOptions = {},
): Promise<T> {
  const accessToken = await getAccessToken();

  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${backendApiBaseUrl()}${path}`, {
    ...options,
    cache: 'no-store',
    headers,
  });

  const fallbackError =
    options.fallbackError || 'Erreur backend. Reessayez dans quelques instants.';

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(toErrorMessage(payload, fallbackError));
  }

  return payload as T;
}

export async function getLocations() {
  return requestBackend<{
    communes: CommuneOption[];
    prefectures: PrefectureOption[];
    regions: RegionOption[];
  }>('/locations', {
    fallbackError: 'Impossible de charger les localisations.',
  });
}

export async function getCurrentMember() {
  return requestBackend<MemberRecord | null>('/members/me', {
    fallbackError: 'Impossible de charger votre profil membre.',
  });
}

export async function getDashboardOverview() {
  return requestBackend<DashboardOverview>('/dashboard/overview', {
    fallbackError: 'Impossible de charger les indicateurs dashboard.',
  });
}

export async function listMembers(filters?: {
  commune_id?: string;
  organisation_id?: string;
  page?: number;
  page_size?: number;
  prefecture_id?: string;
  q?: string;
  region_id?: string;
  sort?: string;
  status?: string;
}) {
  const query = new URLSearchParams();

  if (filters?.q) query.set('q', filters.q);
  if (filters?.status) query.set('status', filters.status);
  if (filters?.region_id) query.set('region_id', filters.region_id);
  if (filters?.prefecture_id) query.set('prefecture_id', filters.prefecture_id);
  if (filters?.commune_id) query.set('commune_id', filters.commune_id);
  if (filters?.organisation_id) query.set('organisation_id', filters.organisation_id);
  if (filters?.sort) query.set('sort', filters.sort);
  if (filters?.page) query.set('page', String(filters.page));
  if (filters?.page_size) query.set('page_size', String(filters.page_size));

  const queryString = query.toString();
  const path = queryString ? `/members?${queryString}` : '/members';

  return requestBackend<{
    count: number;
    page: number;
    pageSize: number;
    rows: MemberRecord[];
  }>(path, {
    fallbackError: 'Impossible de charger la liste des membres.',
  });
}

export async function getMemberById(memberId: string) {
  return requestBackend<MemberRecord | null>(`/members/${memberId}`, {
    fallbackError: 'Impossible de charger ce membre.',
  });
}

export async function updateMemberById(
  memberId: string,
  payload: Partial<MemberRecord>,
) {
  return requestBackend<MemberRecord | null>(`/members/${memberId}`, {
    body: JSON.stringify(payload),
    fallbackError: 'Impossible de mettre a jour ce membre.',
    method: 'PATCH',
  });
}

export async function updateCurrentMember(payload: Partial<MemberRecord>) {
  return requestBackend<MemberRecord | null>('/members/me', {
    body: JSON.stringify(payload),
    fallbackError: 'Impossible de mettre a jour votre compte.',
    method: 'PATCH',
  });
}

export async function completeOnboarding(payload: {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string | null;
  region_id: string;
  prefecture_id: string;
  commune_id: string;
  join_mode: string;
  organisation_id?: string;
  org_name?: string;
}) {
  return requestBackend<{ member_id: string; message: string }>('/onboarding', {
    body: JSON.stringify(payload),
    fallbackError: 'Impossible de finaliser l\'onboarding.',
    method: 'POST',
  });
}

export async function listOrganisations(search?: string) {
  const query = new URLSearchParams();
  if (search) {
    query.set('q', search);
  }
  const queryString = query.toString();

  return requestBackend<{
    can_create: boolean;
    items: OrganisationCardItem[];
    source: string;
    source_note: string | null;
  }>(queryString ? `/organisations?${queryString}` : '/organisations', {
    fallbackError: 'Impossible de charger les organisations.',
  });
}

export async function createOrganisation(payload: {
  name: string;
  type: 'association' | 'enterprise';
}) {
  return requestBackend<{ created_in: string; message: string }>('/organisations', {
    body: JSON.stringify(payload),
    fallbackError: 'Impossible de creer cette organisation.',
    method: 'POST',
  });
}
