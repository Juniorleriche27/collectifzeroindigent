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
