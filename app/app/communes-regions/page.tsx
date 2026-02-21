import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getLocations } from "@/lib/backend/api";
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
  let loadError: string | null = null;

  if (isSupabaseConfigured) {
    try {
      const locations = await getLocations();
      regions = locations.regions;
      prefectures = locations.prefectures;
      communes = locations.communes;
    } catch (error) {
      console.error("Unable to load territorial data", error);
      loadError = "Impossible de charger les donnees territoriales.";
    }
  } else {
    loadError = "Supabase non configure. Ajoutez les variables d'environnement.";
  }

  const regionById = new Map(regions.map((region) => [region.id, region]));
  const prefectureById = new Map(prefectures.map((prefecture) => [prefecture.id, prefecture]));

  const filteredPrefectures = sortByName(
    prefectures.filter((prefecture) => !regionId || prefecture.region_id === regionId),
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
    regions.filter((region) => {
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
          Communes/Regions
        </p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">Gestion territoriale</h2>
      </div>

      {loadError ? (
        <Card>
          <CardDescription className="text-red-600">{loadError}</CardDescription>
        </Card>
      ) : null}

      <Card className="space-y-4">
        <CardTitle className="text-base">Recherche et filtres</CardTitle>
        <form className="grid gap-3 md:grid-cols-4" method="get">
          <Input defaultValue={query} name="q" placeholder="Recherche (region, prefecture, commune)" />
          <Select defaultValue={regionId} name="region_id">
            <option value="">Toutes regions</option>
            {sortByName(regions).map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </Select>
          <Select defaultValue={prefectureId} name="prefecture_id">
            <option value="">Toutes prefectures</option>
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
                Reinitialiser
              </Button>
            </Link>
          </div>
        </form>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardDescription>Regions</CardDescription>
          <CardTitle className="mt-2 text-3xl">{visibleRegions.length}</CardTitle>
        </Card>
        <Card>
          <CardDescription>Prefectures</CardDescription>
          <CardTitle className="mt-2 text-3xl">{visiblePrefectures.length}</CardTitle>
        </Card>
        <Card>
          <CardDescription>Communes</CardDescription>
          <CardTitle className="mt-2 text-3xl">{visibleCommunes.length}</CardTitle>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="space-y-3">
          <CardTitle className="text-base">Liste des regions</CardTitle>
          <div className="max-h-80 space-y-2 overflow-auto pr-1">
            {visibleRegions.length === 0 ? (
              <CardDescription>Aucune region.</CardDescription>
            ) : (
              visibleRegions.map((region) => (
                <div key={region.id} className="rounded-lg border border-border px-3 py-2 text-sm">
                  {region.name}
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="space-y-3">
          <CardTitle className="text-base">Liste des prefectures</CardTitle>
          <div className="max-h-80 space-y-2 overflow-auto pr-1">
            {visiblePrefectures.length === 0 ? (
              <CardDescription>Aucune prefecture.</CardDescription>
            ) : (
              visiblePrefectures.map((prefecture) => (
                <div key={prefecture.id} className="rounded-lg border border-border px-3 py-2 text-sm">
                  <p className="font-medium">{prefecture.name}</p>
                  <p className="text-xs text-muted">{regionById.get(prefecture.region_id)?.name ?? "-"}</p>
                </div>
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
                  <div key={commune.id} className="rounded-lg border border-border px-3 py-2 text-sm">
                    <p className="font-medium">{commune.name}</p>
                    <p className="text-xs text-muted">
                      {prefecture?.name ?? "-"} / {regionName}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
