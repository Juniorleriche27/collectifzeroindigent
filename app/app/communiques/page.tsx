import { listAnnouncements, getLocations } from "@/lib/backend/api";
import { isSupabaseConfigured } from "@/lib/supabase/config";

import { CommuniquesClient } from "./communiques-client";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function paramValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

export default async function CommuniquesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = paramValue(params.q).trim();

  let loadError: string | null = null;
  let canManage = false;
  let role: string | null = null;
  let items: Awaited<ReturnType<typeof listAnnouncements>>["items"] = [];
  let regions: Awaited<ReturnType<typeof getLocations>>["regions"] = [];
  let prefectures: Awaited<ReturnType<typeof getLocations>>["prefectures"] = [];
  let communes: Awaited<ReturnType<typeof getLocations>>["communes"] = [];

  if (isSupabaseConfigured) {
    try {
      const [locationData, result] = await Promise.all([
        getLocations(),
        listAnnouncements(query || undefined),
      ]);
      regions = locationData.regions;
      prefectures = locationData.prefectures;
      communes = locationData.communes;
      items = result.items;
      canManage = result.can_manage;
      role = result.role;
    } catch (error) {
      console.error("Unable to load announcements", error);
      loadError = "Impossible de charger les communiques.";
    }
  } else {
    loadError = "Supabase non configure.";
  }

  return (
    <CommuniquesClient
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
