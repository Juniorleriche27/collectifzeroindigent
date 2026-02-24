import "server-only";

import { createClient } from "@/lib/supabase/server";

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
  cellule_primary: string | null;
  cellule_secondary: string | null;
  validated_at?: string | null;
  validated_by?: string | null;
  validation_reason?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
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

export type ScopeLevel = "all" | "region" | "prefecture" | "commune";

export type AnnouncementScope = {
  announcement_id?: string;
  commune_id: string | null;
  created_at?: string;
  id?: string;
  prefecture_id: string | null;
  region_id: string | null;
  scope_type: ScopeLevel;
};

export type AnnouncementItem = {
  body: string;
  created_at: string;
  created_by: string;
  id: string;
  is_published: boolean;
  scopes: AnnouncementScope[];
  title: string;
  updated_at: string;
};

export type ConversationType = "community" | "direct";
export type CommunityKind = "czi" | "engaged" | "entrepreneur" | "org_leader";

export type ConversationParticipant = {
  can_post: boolean;
  conversation_id: string;
  id: string;
  joined_at: string;
  member: {
    email: string | null;
    first_name: string | null;
    id: string;
    last_name: string | null;
    phone: string | null;
  } | null;
  member_id: string;
};

export type ConversationMessage = {
  body: string;
  conversation_id: string;
  created_at: string;
  deleted_at: string | null;
  edited_at: string | null;
  id: string;
  like_count: number;
  liked_by_me: boolean;
  mention_member_ids: string[];
  parent_message_id: string | null;
  sender?: {
    email: string | null;
    first_name: string | null;
    id: string;
    last_name: string | null;
    phone: string | null;
  } | null;
  sender_member_id: string;
  updated_at: string;
};

export type ConversationItem = {
  commune_id: string | null;
  community_kind: CommunityKind | null;
  conversation_type: ConversationType;
  created_at: string;
  created_by: string;
  id: string;
  latest_message: ConversationMessage | null;
  parent_conversation_id: string | null;
  participants: ConversationParticipant[];
  prefecture_id: string | null;
  region_id: string | null;
  scope_type: ScopeLevel;
  title: string | null;
  updated_at: string;
};

export type CampaignRecipientStatus = "pending" | "sent" | "failed" | "skipped";
export type CampaignStatus = "draft" | "queued" | "sent" | "failed";

export type CampaignStats = {
  failed: number;
  pending: number;
  sent: number;
  skipped: number;
  total: number;
};

export type EmailCampaignItem = {
  audience_scope: ScopeLevel;
  body: string;
  commune_id: string | null;
  created_at: string;
  created_by: string;
  id: string;
  prefecture_id: string | null;
  provider: string | null;
  region_id: string | null;
  scheduled_at: string | null;
  sent_at: string | null;
  stats: CampaignStats;
  status: CampaignStatus;
  subject: string;
  updated_at: string;
};

export type EmailCampaignRecipient = {
  campaign_id: string;
  created_at: string;
  error_message: string | null;
  id: string;
  member_id: string | null;
  recipient_email: string;
  sent_at: string | null;
  status: CampaignRecipientStatus;
};

type BackendRequestOptions = RequestInit & {
  fallbackError?: string;
};

function backendApiBaseUrl(): string {
  const rawBaseUrl =
    process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:4000";

  const baseUrl = rawBaseUrl.endsWith("/") ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

  return baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
}

function toErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const candidate = payload as { error?: unknown; message?: unknown };

  if (Array.isArray(candidate.message)) {
    const text = candidate.message
      .filter((item): item is string => typeof item === "string")
      .join(" ")
      .trim();
    if (text) {
      return text;
    }
  }

  if (typeof candidate.message === "string" && candidate.message.trim()) {
    return candidate.message.trim();
  }

  if (typeof candidate.error === "string" && candidate.error.trim()) {
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
    throw new Error("Session invalide. Reconnectez-vous.");
  }

  return session.access_token;
}

async function requestBackend<T>(path: string, options: BackendRequestOptions = {}): Promise<T> {
  const accessToken = await getAccessToken();

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${backendApiBaseUrl()}${path}`, {
    ...options,
    cache: "no-store",
    headers,
  });

  const fallbackError =
    options.fallbackError || "Erreur backend. Reessayez dans quelques instants.";

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
  }>("/locations", {
    fallbackError: "Impossible de charger les localisations.",
  });
}

export async function getCurrentMember() {
  return requestBackend<MemberRecord | null>("/members/me", {
    fallbackError: "Impossible de charger votre profil membre.",
  });
}

export async function getDashboardOverview() {
  return requestBackend<DashboardOverview>("/dashboard/overview", {
    fallbackError: "Impossible de charger les indicateurs dashboard.",
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

  if (filters?.q) query.set("q", filters.q);
  if (filters?.status) query.set("status", filters.status);
  if (filters?.region_id) query.set("region_id", filters.region_id);
  if (filters?.prefecture_id) query.set("prefecture_id", filters.prefecture_id);
  if (filters?.commune_id) query.set("commune_id", filters.commune_id);
  if (filters?.organisation_id) query.set("organisation_id", filters.organisation_id);
  if (filters?.sort) query.set("sort", filters.sort);
  if (filters?.page) query.set("page", String(filters.page));
  if (filters?.page_size) query.set("page_size", String(filters.page_size));

  const queryString = query.toString();
  const path = queryString ? `/members?${queryString}` : "/members";

  return requestBackend<{
    count: number;
    page: number;
    pageSize: number;
    rows: MemberRecord[];
  }>(path, {
    fallbackError: "Impossible de charger la liste des membres.",
  });
}

export async function getMemberById(memberId: string) {
  return requestBackend<MemberRecord | null>(`/members/${memberId}`, {
    fallbackError: "Impossible de charger ce membre.",
  });
}

export async function updateMemberById(memberId: string, payload: Partial<MemberRecord>) {
  return requestBackend<MemberRecord | null>(`/members/${memberId}`, {
    body: JSON.stringify(payload),
    fallbackError: "Impossible de mettre a jour ce membre.",
    method: "PATCH",
  });
}

export async function updateCurrentMember(payload: Partial<MemberRecord>) {
  return requestBackend<MemberRecord | null>("/members/me", {
    body: JSON.stringify(payload),
    fallbackError: "Impossible de mettre a jour votre compte.",
    method: "PATCH",
  });
}

export async function validateMemberById(
  memberId: string,
  payload: {
    cellule_primary?: "engaged" | "entrepreneur" | "org_leader";
    cellule_secondary?: "engaged" | "entrepreneur" | "org_leader" | null;
    decision: "approve" | "reject";
    reason?: string;
  },
) {
  return requestBackend<{
    member: MemberRecord | null;
    message: string;
  }>(`/members/${memberId}/validation`, {
    body: JSON.stringify(payload),
    fallbackError: "Impossible de valider ce membre.",
    method: "PATCH",
  });
}

export async function completeOnboarding(payload: {
  age_range?: string;
  availability?: string;
  birth_date?: string;
  business_needs?: string[];
  business_sector?: string;
  business_stage?: string;
  cellule_primary?: "engaged" | "entrepreneur" | "org_leader";
  cellule_secondary?: "engaged" | "entrepreneur" | "org_leader";
  first_name: string;
  consent_ai_training_agg?: boolean;
  consent_analytics?: boolean;
  consent_terms?: boolean;
  contact_preference?: "whatsapp" | "email" | "call";
  last_name: string;
  education_level?: string;
  engagement_domains?: string[];
  engagement_frequency?: string;
  engagement_recent_action?: string;
  phone: string;
  email?: string | null;
  gender?: string;
  goal_3_6_months?: string;
  interests?: string[];
  region_id: string;
  prefecture_id: string;
  commune_id: string;
  join_mode: string;
  locality?: string;
  mobility?: boolean;
  mobility_zones?: string;
  odd_priorities?: number[];
  org_name_declared?: string;
  org_role?: string;
  org_type?: "association" | "enterprise";
  partner_request?: boolean;
  profession_title?: string;
  skills?: Array<{ level: string; name: string }>;
  support_types?: string[];
  organisation_id?: string;
  org_name?: string;
}) {
  return requestBackend<{ member_id: string; message: string }>("/onboarding", {
    body: JSON.stringify(payload),
    fallbackError: "Impossible de finaliser l'onboarding.",
    method: "POST",
  });
}

export async function listOrganisations(search?: string) {
  const query = new URLSearchParams();
  if (search) {
    query.set("q", search);
  }
  const queryString = query.toString();

  return requestBackend<{
    can_create: boolean;
    items: OrganisationCardItem[];
    source: string;
    source_note: string | null;
  }>(queryString ? `/organisations?${queryString}` : "/organisations", {
    fallbackError: "Impossible de charger les organisations.",
  });
}

export async function createOrganisation(payload: {
  name: string;
  type: "association" | "enterprise";
}) {
  return requestBackend<{ created_in: string; message: string }>("/organisations", {
    body: JSON.stringify(payload),
    fallbackError: "Impossible de creer cette organisation.",
    method: "POST",
  });
}

export async function listAnnouncements(search?: string) {
  const query = new URLSearchParams();
  if (search) query.set("q", search);
  const queryString = query.toString();

  return requestBackend<{
    can_manage: boolean;
    items: AnnouncementItem[];
    role: string;
  }>(queryString ? `/announcements?${queryString}` : "/announcements", {
    fallbackError: "Impossible de charger les communiques.",
  });
}

export async function createAnnouncement(payload: {
  body: string;
  is_published?: boolean;
  scopes?: Array<{
    commune_id?: string | null;
    prefecture_id?: string | null;
    region_id?: string | null;
    scope_type: ScopeLevel;
  }>;
  title: string;
}) {
  return requestBackend<{
    item: AnnouncementItem | null;
    message: string;
  }>("/announcements", {
    body: JSON.stringify(payload),
    fallbackError: "Impossible de publier le communique.",
    method: "POST",
  });
}

export async function updateAnnouncement(
  announcementId: string,
  payload: {
    body?: string;
    is_published?: boolean;
    scopes?: Array<{
      commune_id?: string | null;
      prefecture_id?: string | null;
      region_id?: string | null;
      scope_type: ScopeLevel;
    }>;
    title?: string;
  },
) {
  return requestBackend<{
    item: AnnouncementItem | null;
    message: string;
  }>(`/announcements/${announcementId}`, {
    body: JSON.stringify(payload),
    fallbackError: "Impossible de modifier le communique.",
    method: "PATCH",
  });
}

export async function deleteAnnouncement(announcementId: string) {
  return requestBackend<{
    deleted: boolean;
    message: string;
  }>(`/announcements/${announcementId}`, {
    fallbackError: "Impossible de supprimer le communique.",
    method: "DELETE",
  });
}

export async function listConversations(filters?: {
  conversation_type?: ConversationType;
  q?: string;
}) {
  const query = new URLSearchParams();
  if (filters?.conversation_type) query.set("conversation_type", filters.conversation_type);
  if (filters?.q) query.set("q", filters.q);
  const queryString = query.toString();

  return requestBackend<{
    current_member_id: string | null;
    items: ConversationItem[];
  }>(queryString ? `/conversations?${queryString}` : "/conversations", {
    fallbackError: "Impossible de charger les discussions.",
  });
}

export async function createConversation(payload: {
  conversation_type: ConversationType;
  parent_conversation_id?: string;
  participant_member_ids?: string[];
  title?: string;
}) {
  return requestBackend<{
    item: ConversationItem;
    message: string;
  }>("/conversations", {
    body: JSON.stringify(payload),
    fallbackError: "Impossible de creer la conversation.",
    method: "POST",
  });
}

export async function listConversationMessages(
  conversationId: string,
  options?: { before?: string; limit?: number },
) {
  const query = new URLSearchParams();
  if (options?.before) query.set("before", options.before);
  if (options?.limit) query.set("limit", String(options.limit));
  const queryString = query.toString();

  return requestBackend<{ items: ConversationMessage[] }>(
    queryString
      ? `/conversations/${conversationId}/messages?${queryString}`
      : `/conversations/${conversationId}/messages`,
    {
      fallbackError: "Impossible de charger les messages.",
    },
  );
}

export async function postConversationMessage(
  conversationId: string,
  payload: {
    body: string;
    mention_member_ids?: string[];
    parent_message_id?: string;
  },
) {
  return requestBackend<{
    item: ConversationMessage;
    message: string;
  }>(`/conversations/${conversationId}/messages`, {
    body: JSON.stringify(payload),
    fallbackError: "Impossible d'envoyer le message.",
    method: "POST",
  });
}

export async function updateConversationMessage(
  conversationId: string,
  messageId: string,
  payload: {
    body: string;
    mention_member_ids?: string[];
  },
) {
  return requestBackend<{
    item: ConversationMessage;
    message: string;
  }>(`/conversations/${conversationId}/messages/${messageId}`, {
    body: JSON.stringify(payload),
    fallbackError: "Impossible de modifier le message.",
    method: "PATCH",
  });
}

export async function toggleConversationMessageLike(
  conversationId: string,
  messageId: string,
) {
  return requestBackend<{
    like_count: number;
    liked: boolean;
    message: string;
  }>(`/conversations/${conversationId}/messages/${messageId}/likes/toggle`, {
    fallbackError: "Impossible de mettre a jour le like.",
    method: "POST",
  });
}

export async function listEmailCampaigns(search?: string) {
  const query = new URLSearchParams();
  if (search) query.set("q", search);
  const queryString = query.toString();

  return requestBackend<{
    can_manage: boolean;
    items: EmailCampaignItem[];
    role: string;
  }>(queryString ? `/email-campaigns?${queryString}` : "/email-campaigns", {
    fallbackError: "Impossible de charger les campagnes email.",
  });
}

export async function createEmailCampaign(payload: {
  audience_scope?: ScopeLevel;
  body: string;
  commune_id?: string;
  prefecture_id?: string;
  provider?: string;
  region_id?: string;
  subject: string;
}) {
  return requestBackend<{
    item: EmailCampaignItem;
    message: string;
  }>("/email-campaigns", {
    body: JSON.stringify(payload),
    fallbackError: "Impossible de creer la campagne email.",
    method: "POST",
  });
}

export async function queueEmailCampaign(campaignId: string) {
  return requestBackend<{
    item: EmailCampaignItem;
    message: string;
    recipients: EmailCampaignRecipient[];
    stats: CampaignStats;
  }>(`/email-campaigns/${campaignId}/queue`, {
    fallbackError: "Impossible de mettre la campagne en file.",
    method: "POST",
  });
}

export async function sendEmailCampaign(campaignId: string) {
  return requestBackend<{
    item: EmailCampaignItem;
    message: string;
    recipients: EmailCampaignRecipient[];
    stats: CampaignStats;
  }>(`/email-campaigns/${campaignId}/send`, {
    fallbackError: "Impossible de marquer la campagne comme envoyee.",
    method: "POST",
  });
}
