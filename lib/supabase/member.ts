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

export type MemberListItem = {
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
  org_name: string | null;
};

export async function getMemberForUser(userId: string): Promise<{ id: string } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("member")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getOnboardingLocations(): Promise<{
  regions: RegionOption[];
  prefectures: PrefectureOption[];
  communes: CommuneOption[];
}> {
  const supabase = await createClient();
  const [regionsResult, prefecturesResult, communesResult] = await Promise.all([
    supabase.from("region").select("id, name").order("name"),
    supabase.from("prefecture").select("id, name, region_id").order("name"),
    supabase.from("commune").select("id, name, prefecture_id").order("name"),
  ]);

  if (regionsResult.error) throw regionsResult.error;
  if (prefecturesResult.error) throw prefecturesResult.error;
  if (communesResult.error) throw communesResult.error;

  return {
    regions: regionsResult.data ?? [],
    prefectures: prefecturesResult.data ?? [],
    communes: communesResult.data ?? [],
  };
}

export async function listMembers(filters?: {
  communeId?: string;
  prefectureId?: string;
  regionId?: string;
  search?: string;
  status?: string;
}): Promise<MemberListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("member")
    .select(
      "id, user_id, first_name, last_name, phone, email, status, region_id, prefecture_id, commune_id, join_mode, org_name",
    )
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.regionId) {
    query = query.eq("region_id", filters.regionId);
  }
  if (filters?.prefectureId) {
    query = query.eq("prefecture_id", filters.prefectureId);
  }
  if (filters?.communeId) {
    query = query.eq("commune_id", filters.communeId);
  }
  if (filters?.search) {
    const safeSearch = filters.search.replaceAll(",", " ").trim();
    if (safeSearch) {
      query = query.or(
        `first_name.ilike.%${safeSearch}%,last_name.ilike.%${safeSearch}%,phone.ilike.%${safeSearch}%,email.ilike.%${safeSearch}%`,
      );
    }
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getMemberById(memberId: string): Promise<MemberListItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("member")
    .select(
      "id, user_id, first_name, last_name, phone, email, status, region_id, prefecture_id, commune_id, join_mode, org_name",
    )
    .eq("id", memberId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
