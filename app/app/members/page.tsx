import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getOnboardingLocations, listMembers } from "@/lib/supabase/member";

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

export default async function MembersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = paramValue(params.q).trim();
  const status = paramValue(params.status);
  const regionId = paramValue(params.region_id);
  const prefectureId = paramValue(params.prefecture_id);
  const communeId = paramValue(params.commune_id);

  let loadError: string | null = null;
  let members = [] as Awaited<ReturnType<typeof listMembers>>;
  let regions = [] as Awaited<ReturnType<typeof getOnboardingLocations>>["regions"];
  let prefectures = [] as Awaited<ReturnType<typeof getOnboardingLocations>>["prefectures"];
  let communes = [] as Awaited<ReturnType<typeof getOnboardingLocations>>["communes"];

  if (isSupabaseConfigured) {
    try {
      const [locationData, memberRows] = await Promise.all([
        getOnboardingLocations(),
        listMembers({
          communeId: communeId || undefined,
          prefectureId: prefectureId || undefined,
          regionId: regionId || undefined,
          search: query || undefined,
          status: status || undefined,
        }),
      ]);
      regions = locationData.regions;
      prefectures = locationData.prefectures;
      communes = locationData.communes;
      members = memberRows;
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
        <Link href="/app/members">
          <Button variant="secondary">Reinitialiser</Button>
        </Link>
      </div>

      <Card className="space-y-4">
        <CardTitle className="text-base">Recherche</CardTitle>
        <form className="grid gap-3 md:grid-cols-5" method="get">
          <Input defaultValue={query} name="q" placeholder="Nom, email, telephone..." />
          <Select defaultValue={status} name="status">
            <option value="">Tous statuts</option>
            <option value="active">Actif</option>
            <option value="pending">En attente</option>
            <option value="suspended">Suspendu</option>
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
          <div className="md:col-span-5">
            <Button type="submit">Appliquer les filtres</Button>
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
                    <Badge variant={statusVariant(member.status)}>{member.status ?? "unknown"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Link className="font-semibold text-primary" href={`/app/members/${member.id}`}>
                      Voir detail
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
