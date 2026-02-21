import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getLocations, listMembers } from "@/lib/backend/api";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function paramValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function statusVariant(status: string | null): "success" | "warning" | "danger" | "default" {
  if (status === "active") return "success";
  if (status === "pending") return "warning";
  if (status === "suspended") return "danger";
  return "default";
}

function parsePositiveInt(value: string, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.floor(parsed);
}

function normalizePageSize(value: number): number {
  if (value === 20 || value === 50) {
    return value;
  }
  return 10;
}

export default async function MembersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = paramValue(params.q).trim();
  const status = paramValue(params.status);
  const regionId = paramValue(params.region_id);
  const prefectureId = paramValue(params.prefecture_id);
  const communeId = paramValue(params.commune_id);
  const sort = paramValue(params.sort) || "created_desc";
  const page = parsePositiveInt(paramValue(params.page), 1);
  const pageSize = normalizePageSize(parsePositiveInt(paramValue(params.page_size), 10));

  let loadError: string | null = null;
  let members = [] as Awaited<ReturnType<typeof listMembers>>["rows"];
  let totalCount = 0;
  let regions = [] as Awaited<ReturnType<typeof getLocations>>["regions"];
  let prefectures = [] as Awaited<ReturnType<typeof getLocations>>["prefectures"];
  let communes = [] as Awaited<ReturnType<typeof getLocations>>["communes"];

  if (isSupabaseConfigured) {
    try {
      const [locationData, memberData] = await Promise.all([
        getLocations(),
        listMembers({
          commune_id: communeId || undefined,
          page,
          page_size: pageSize,
          prefecture_id: prefectureId || undefined,
          q: query || undefined,
          region_id: regionId || undefined,
          sort:
            sort === "created_asc" || sort === "name_asc" || sort === "name_desc" || sort === "status_asc"
              ? sort
              : "created_desc",
          status: status || undefined,
        }),
      ]);
      regions = locationData.regions;
      prefectures = locationData.prefectures;
      communes = locationData.communes;
      members = memberData.rows;
      totalCount = memberData.count;
    } catch (error) {
      console.error("Unable to load member list", error);
      loadError = "Impossible de charger la liste des membres.";
    }
  }

  const availablePrefectures = regionId
    ? prefectures.filter((prefecture) => String(prefecture.region_id) === regionId)
    : prefectures;
  const availableCommunes = prefectureId
    ? communes.filter((commune) => String(commune.prefecture_id) === prefectureId)
    : communes;

  const regionsById = new Map(regions.map((region) => [String(region.id), region.name]));
  const prefecturesById = new Map(
    prefectures.map((prefecture) => [String(prefecture.id), prefecture.name]),
  );
  const communesById = new Map(communes.map((commune) => [String(commune.id), commune.name]));
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, totalPages);
  const hasPreviousPage = safePage > 1;
  const hasNextPage = safePage < totalPages;

  function buildPageHref(nextPage: number): string {
    const urlParams = new URLSearchParams();
    if (query) urlParams.set("q", query);
    if (status) urlParams.set("status", status);
    if (regionId) urlParams.set("region_id", regionId);
    if (prefectureId) urlParams.set("prefecture_id", prefectureId);
    if (communeId) urlParams.set("commune_id", communeId);
    if (sort) urlParams.set("sort", sort);
    if (pageSize !== 10) urlParams.set("page_size", String(pageSize));
    if (nextPage > 1) urlParams.set("page", String(nextPage));
    const serialized = urlParams.toString();
    return serialized ? `/app/membres?${serialized}` : "/app/membres";
  }

  const startItem = totalCount === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = totalCount === 0 ? 0 : Math.min(totalCount, safePage * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Membres</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">Liste & filtres</h2>
          <CardDescription className="mt-2">
            En compte standard RLS, seuls vos enregistrements sont visibles.
          </CardDescription>
        </div>
        <Link href="/app/membres">
          <Button variant="secondary">Reinitialiser</Button>
        </Link>
      </div>

      <Card className="space-y-4">
        <CardTitle className="text-base">Recherche</CardTitle>
        <form className="grid gap-3 md:grid-cols-6" method="get">
          <Input defaultValue={query} name="q" placeholder="Nom, email, telephone..." />
          <Select defaultValue={status} name="status">
            <option value="">Tous statuts</option>
            <option value="active">Actif</option>
            <option value="pending">En attente</option>
          </Select>
          <Select defaultValue={regionId} name="region_id">
            <option value="">Toutes regions</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </Select>
          <Select defaultValue={prefectureId} name="prefecture_id">
            <option value="">Toutes prefectures</option>
            {availablePrefectures.map((prefecture) => (
              <option key={prefecture.id} value={prefecture.id}>
                {prefecture.name}
              </option>
            ))}
          </Select>
          <Select defaultValue={communeId} name="commune_id">
            <option value="">Toutes communes</option>
            {availableCommunes.map((commune) => (
              <option key={commune.id} value={commune.id}>
                {commune.name}
              </option>
            ))}
          </Select>
          <Select defaultValue={sort} name="sort">
            <option value="created_desc">Plus recents</option>
            <option value="created_asc">Plus anciens</option>
            <option value="name_asc">Nom A-Z</option>
            <option value="name_desc">Nom Z-A</option>
            <option value="status_asc">Status</option>
          </Select>
          <Select defaultValue={String(pageSize)} name="page_size">
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
            <option value="50">50 / page</option>
          </Select>
          <div className="md:col-span-6 flex items-center gap-3">
            <Button type="submit">Appliquer les filtres</Button>
            <p className="text-sm text-muted">{totalCount} resultat(s)</p>
          </div>
        </form>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[860px] text-left">
          <thead className="bg-muted-surface">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                ID
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                Nom
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                Contact
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                Localisation
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                Statut
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {!isSupabaseConfigured ? (
              <tr className="border-t border-border">
                <td className="px-4 py-6 text-sm text-muted" colSpan={6}>
                  Configurez Supabase pour charger les donnees membres.
                </td>
              </tr>
            ) : loadError ? (
              <tr className="border-t border-border">
                <td className="px-4 py-6 text-sm text-red-600" colSpan={6}>
                  {loadError}
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr className="border-t border-border">
                <td className="px-4 py-6 text-sm text-muted" colSpan={6}>
                  Aucun membre ne correspond aux filtres.
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id} className="border-t border-border">
                  <td className="px-4 py-3 text-sm font-medium">{member.id}</td>
                  <td className="px-4 py-3 text-sm">
                    {[member.first_name, member.last_name].filter(Boolean).join(" ") || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">
                    {member.phone ?? "-"}
                    <br />
                    {member.email ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">
                    {(regionsById.get(String(member.region_id)) ?? "-") +
                      " / " +
                      (prefecturesById.get(String(member.prefecture_id)) ?? "-") +
                      " / " +
                      (communesById.get(String(member.commune_id)) ?? "-")}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant={statusVariant(member.status)}>
                      {member.status ?? "unknown"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-3">
                      <Link className="font-semibold text-primary" href={`/app/membres/${member.id}`}>
                        Voir
                      </Link>
                      <Link className="text-sm font-medium text-muted hover:text-foreground" href={`/app/membres/${member.id}`}>
                        Modifier
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
        <p className="text-sm text-muted">
          Page {safePage} / {totalPages} | {startItem}-{endItem} sur {totalCount}
        </p>
        <div className="flex gap-2">
          <Link href={buildPageHref(Math.max(1, safePage - 1))}>
            <Button disabled={!hasPreviousPage} variant="secondary">
              Precedent
            </Button>
          </Link>
          <Link href={buildPageHref(Math.min(totalPages, safePage + 1))}>
            <Button disabled={!hasNextPage} variant="secondary">
              Suivant
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
