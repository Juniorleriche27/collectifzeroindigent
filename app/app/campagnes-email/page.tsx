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

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  return fallback;
}

export default async function CampagnesEmailPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = paramValue(params.q).trim();

  let loadError: string | null = null;
  let items: Awaited<ReturnType<typeof listEmailCampaigns>>["items"] = [];
  let canManage = false;
  let role: string | null = null;
  let regions: Awaited<ReturnType<typeof getLocations>>["regions"] = [];
  let prefectures: Awaited<ReturnType<typeof getLocations>>["prefectures"] = [];
  let communes: Awaited<ReturnType<typeof getLocations>>["communes"] = [];

  if (isSupabaseConfigured) {
    try {
      const locationData = await getLocations();
      regions = locationData.regions;
      prefectures = locationData.prefectures;
      communes = locationData.communes;
    } catch (error) {
      console.error("Unable to load locations for email campaigns", error);
      loadError = toErrorMessage(error, "Impossible de charger les localisations.");
    }

    try {
      const campaignData = await listEmailCampaigns(query || undefined);
      items = campaignData.items;
      canManage = campaignData.can_manage;
      role = campaignData.role;
    } catch (error) {
      console.error("Unable to load email campaigns", error);
      loadError =
        loadError ?? toErrorMessage(error, "Impossible de charger les campagnes email.");
    }
  } else {
    loadError = "Supabase non configure.";
  }

  return (
    <CampagnesEmailClient
      canManage={canManage}
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
