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
  created_at?: string | null;
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
  page?: number;
  pageSize?: number;
  prefectureId?: string;
  regionId?: string;
  search?: string;
  sort?: "created_desc" | "created_asc" | "name_asc" | "name_desc" | "status_asc";
  status?: string;
}): Promise<{ count: number; rows: MemberListItem[] }> {
  const supabase = await createClient();
  const page = Math.max(1, filters?.page ?? 1);
  const pageSize = Math.max(1, Math.min(50, filters?.pageSize ?? 10));
  const rangeFrom = (page - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize - 1;

  let query = supabase
    .from("member")
    .select(
      "id, user_id, first_name, last_name, phone, email, status, region_id, prefecture_id, commune_id, join_mode, org_name, created_at",
      { count: "exact" },
    )
    .range(rangeFrom, rangeTo);

  const sort = filters?.sort ?? "created_desc";
  if (sort === "name_asc") {
    query = query.order("last_name", { ascending: true }).order("first_name", { ascending: true });
  } else if (sort === "name_desc") {
    query = query
      .order("last_name", { ascending: false })
      .order("first_name", { ascending: false });
  } else if (sort === "created_asc") {
    query = query.order("created_at", { ascending: true });
  } else if (sort === "status_asc") {
    query = query.order("status", { ascending: true }).order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

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

  const { data, error, count } = await query;
  if (error) {
    throw error;
  }

  return {
    count: count ?? 0,
    rows: data ?? [],
  };
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
