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

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  return fallback;
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
      const [locationResult, announcementsResult] = await Promise.allSettled([
        getLocations(),
        listAnnouncements(query || undefined),
      ]);
      if (locationResult.status === "fulfilled") {
        regions = locationResult.value.regions;
        prefectures = locationResult.value.prefectures;
        communes = locationResult.value.communes;
      } else {
        console.error("Unable to load locations for announcements", locationResult.reason);
        loadError = toErrorMessage(locationResult.reason, "Impossible de charger les localisations.");
      }
      if (announcementsResult.status === "fulfilled") {
        items = announcementsResult.value.items;
        canManage = announcementsResult.value.can_manage;
        role = announcementsResult.value.role;
      } else {
        console.error("Unable to load announcements", announcementsResult.reason);
        loadError =
          loadError ?? toErrorMessage(announcementsResult.reason, "Impossible de charger les communiques.");
      }
    } catch (error) {
      console.error("Unable to load communiques data", error);
      loadError = toErrorMessage(error, "Impossible de charger les communiques.");
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
