import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getLocations } from "@/lib/backend/api";
import { getVisibleMemberLocationCounts } from "@/lib/supabase/member";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type NamedRow = {
  id: string;
  name: string;
};

function paramValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function sortByName<T extends NamedRow>(rows: T[]): T[] {
  return [...rows].sort((first, second) => first.name.localeCompare(second.name, "fr"));
}

function membersHref(filters: {
  communeId?: string;
  prefectureId?: string;
  regionId?: string;
}) {
  const params = new URLSearchParams();
  if (filters.regionId) {
    params.set("region_id", filters.regionId);
  }
  if (filters.prefectureId) {
    params.set("prefecture_id", filters.prefectureId);
  }
  if (filters.communeId) {
    params.set("commune_id", filters.communeId);
  }

  const query = params.toString();
  return query ? `/app/membres?${query}` : "/app/membres";
}

export default async function CommunesRegionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = paramValue(params.q).trim();
  const regionId = paramValue(params.region_id).trim();
  const prefectureId = paramValue(params.prefecture_id).trim();

  let regions: Awaited<ReturnType<typeof getLocations>>["regions"] = [];
  let prefectures: Awaited<ReturnType<typeof getLocations>>["prefectures"] = [];
  let communes: Awaited<ReturnType<typeof getLocations>>["communes"] = [];
  let totalVisibleMembers = 0;
  let memberCountByRegionId = new Map<string, number>();
  let memberCountByPrefectureId = new Map<string, number>();
  let memberCountByCommuneId = new Map<string, number>();
  let loadError: string | null = null;

  if (isSupabaseConfigured) {
    try {
      const [locations, locationCounts] = await Promise.all([
        getLocations(),
        getVisibleMemberLocationCounts({
          prefectureId: prefectureId || undefined,
          regionId: regionId || undefined,
        }),
      ]);
      regions = locations.regions;
      prefectures = locations.prefectures;
      communes = locations.communes;
      totalVisibleMembers = locationCounts.total;
      memberCountByRegionId = locationCounts.byRegionId;
      memberCountByPrefectureId = locationCounts.byPrefectureId;
      memberCountByCommuneId = locationCounts.byCommuneId;
    } catch (error) {
      console.error("Unable to load territorial data", error);
      loadError = "Impossible de charger les données territoriales.";
    }
  } else {
    loadError = "Supabase non configuré. Ajoutez les variables d'environnement.";
  }

  const regionById = new Map(regions.map((region) => [region.id, region]));
  const prefectureById = new Map(prefectures.map((prefecture) => [prefecture.id, prefecture]));
  const filteredRegions = sortByName(regions.filter((region) => !regionId || region.id === regionId));

  const filteredPrefectures = sortByName(
    prefectures.filter((prefecture) => {
      if (regionId && prefecture.region_id !== regionId) return false;
      if (prefectureId && prefecture.id !== prefectureId) return false;
      return true;
    }),
  );
  const filteredCommunes = sortByName(
    communes.filter((commune) => {
      if (prefectureId && commune.prefecture_id !== prefectureId) return false;
      if (!regionId) return true;
      const prefecture = prefectureById.get(commune.prefecture_id);
      return prefecture?.region_id === regionId;
    }),
  );

  const normalizedQuery = query.toLowerCase();
  const visibleRegions = sortByName(
    filteredRegions.filter((region) => {
      if (!normalizedQuery) return true;
      return region.name.toLowerCase().includes(normalizedQuery);
    }),
  );
  const visiblePrefectures = filteredPrefectures.filter((prefecture) => {
    if (!normalizedQuery) return true;
    const regionName = regionById.get(prefecture.region_id)?.name ?? "";
    return `${prefecture.name} ${regionName}`.toLowerCase().includes(normalizedQuery);
  });
  const visibleCommunes = filteredCommunes.filter((commune) => {
    if (!normalizedQuery) return true;
    const prefecture = prefectureById.get(commune.prefecture_id);
    const regionName = prefecture ? regionById.get(prefecture.region_id)?.name ?? "" : "";
    const prefectureName = prefecture?.name ?? "";
    return `${commune.name} ${prefectureName} ${regionName}`.toLowerCase().includes(normalizedQuery);
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          Communes/Régions
        </p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">Gestion territoriale</h2>
        <CardDescription className="mt-2">
          Référentiel territorial avec volume de membres visibles par région, préfecture et commune.
        </CardDescription>
      </div>

      {loadError ? (
        <Card>
          <CardDescription className="text-red-600">{loadError}</CardDescription>
        </Card>
      ) : null}

      <Card className="space-y-4">
        <CardTitle className="text-base">Recherche et filtres</CardTitle>
        <form className="grid gap-3 md:grid-cols-4" method="get">
          <Input defaultValue={query} name="q" placeholder="Recherche (région, préfecture, commune)" />
          <Select defaultValue={regionId} name="region_id">
            <option value="">Toutes les régions</option>
            {sortByName(regions).map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </Select>
          <Select defaultValue={prefectureId} name="prefecture_id">
            <option value="">Toutes les préfectures</option>
            {filteredPrefectures.map((prefecture) => (
              <option key={prefecture.id} value={prefecture.id}>
                {prefecture.name}
              </option>
            ))}
          </Select>
          <div className="flex gap-2">
            <Button type="submit">Appliquer</Button>
            <Link href="/app/communes-regions">
              <Button type="button" variant="ghost">
                Réinitialiser
              </Button>
            </Link>
          </div>
        </form>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardDescription>Régions</CardDescription>
          <CardTitle className="mt-2 text-3xl">{visibleRegions.length}</CardTitle>
        </Card>
        <Card>
          <CardDescription>Préfectures</CardDescription>
          <CardTitle className="mt-2 text-3xl">{visiblePrefectures.length}</CardTitle>
        </Card>
        <Card>
          <CardDescription>Communes</CardDescription>
          <CardTitle className="mt-2 text-3xl">{visibleCommunes.length}</CardTitle>
        </Card>
        <Card>
          <CardDescription>Membres visibles</CardDescription>
          <CardTitle className="mt-2 text-3xl">{totalVisibleMembers}</CardTitle>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="space-y-3">
          <CardTitle className="text-base">Liste des régions</CardTitle>
          <div className="max-h-80 space-y-2 overflow-auto pr-1">
            {visibleRegions.length === 0 ? (
              <CardDescription>Aucune région.</CardDescription>
            ) : (
              visibleRegions.map((region) => (
                <Link
                  href={membersHref({ regionId: region.id })}
                  key={region.id}
                  className="block rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:border-primary/40 hover:bg-muted-surface/50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{region.name}</p>
                    <Badge variant="default">
                      {memberCountByRegionId.get(region.id) ?? 0} membre(s)
                    </Badge>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>

        <Card className="space-y-3">
          <CardTitle className="text-base">Liste des préfectures</CardTitle>
          <div className="max-h-80 space-y-2 overflow-auto pr-1">
            {visiblePrefectures.length === 0 ? (
              <CardDescription>Aucune préfecture.</CardDescription>
            ) : (
              visiblePrefectures.map((prefecture) => (
                <Link
                  href={membersHref({
                    prefectureId: prefecture.id,
                    regionId: prefecture.region_id,
                  })}
                  key={prefecture.id}
                  className="block rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:border-primary/40 hover:bg-muted-surface/50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{prefecture.name}</p>
                    <Badge variant="default">
                      {memberCountByPrefectureId.get(prefecture.id) ?? 0} membre(s)
                    </Badge>
                  </div>
                  <p className="text-xs text-muted">{regionById.get(prefecture.region_id)?.name ?? "-"}</p>
                </Link>
              ))
            )}
          </div>
        </Card>

        <Card className="space-y-3">
          <CardTitle className="text-base">Liste des communes</CardTitle>
          <div className="max-h-80 space-y-2 overflow-auto pr-1">
            {visibleCommunes.length === 0 ? (
              <CardDescription>Aucune commune.</CardDescription>
            ) : (
              visibleCommunes.map((commune) => {
                const prefecture = prefectureById.get(commune.prefecture_id);
                const regionName = prefecture ? regionById.get(prefecture.region_id)?.name ?? "-" : "-";

                return (
                  <Link
                    href={membersHref({
                      communeId: commune.id,
                      prefectureId: commune.prefecture_id,
                      regionId: prefecture?.region_id,
                    })}
                    key={commune.id}
                    className="block rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:border-primary/40 hover:bg-muted-surface/50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{commune.name}</p>
                      <Badge variant="default">
                        {memberCountByCommuneId.get(commune.id) ?? 0} membre(s)
                      </Badge>
                    </div>
                    <p className="text-xs text-muted">
                      {prefecture?.name ?? "-"} / {regionName}
                    </p>
                  </Link>
                );
              })
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
