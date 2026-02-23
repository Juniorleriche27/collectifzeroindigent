import { getLocations, listEmailCampaigns } from "@/lib/backend/api";
import { isSupabaseConfigured } from "@/lib/supabase/config";

import { CampagnesEmailClient } from "./campagnes-email-client";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function paramValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

export default async function CampagnesEmailPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = paramValue(params.q).trim();

  let loadError: string | null = null;
  let items: Awaited<ReturnType<typeof listEmailCampaigns>>["items"] = [];
  let role: string | null = null;
  let regions: Awaited<ReturnType<typeof getLocations>>["regions"] = [];
  let prefectures: Awaited<ReturnType<typeof getLocations>>["prefectures"] = [];
  let communes: Awaited<ReturnType<typeof getLocations>>["communes"] = [];

  if (isSupabaseConfigured) {
    try {
      const [campaignData, locationData] = await Promise.all([
        listEmailCampaigns(query || undefined),
        getLocations(),
      ]);
      items = campaignData.items;
      role = campaignData.role;
      regions = locationData.regions;
      prefectures = locationData.prefectures;
      communes = locationData.communes;
    } catch (error) {
      console.error("Unable to load email campaigns", error);
      loadError = "Impossible de charger les campagnes email.";
    }
  } else {
    loadError = "Supabase non configure.";
  }

  return (
    <CampagnesEmailClient
      communes={communes}
      initialQuery={query}
      items={items}
      loadError={loadError}
      prefectures={prefectures}
      regions={regions}
      role={role}
    />
  );
}
