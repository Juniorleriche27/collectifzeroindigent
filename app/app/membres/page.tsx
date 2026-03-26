import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { MemberContactLink } from "@/components/app/member-contact-link";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { MemberListStats } from "@/lib/backend/api";
import { getCurrentMember, getLocations, listMembers, listOrganisations } from "@/lib/backend/api";
import { getCurrentUser } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getCurrentProfileRole } from "@/lib/supabase/profile-server";

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
  if (status === "rejected") return "danger";
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

function emptyMemberStats(): MemberListStats {
  return {
    by_age_range: [
      { count: 0, key: "15-19", label: "15-19 ans" },
      { count: 0, key: "20-24", label: "20-24 ans" },
      { count: 0, key: "25-29", label: "25-29 ans" },
      { count: 0, key: "30-35", label: "30-35 ans" },
      { count: 0, key: "36+", label: "36+ ans" },
      { count: 0, key: "unknown", label: "Non renseigne" },
    ],
    by_gender: [
      { count: 0, key: "female", label: "Femmes" },
      { count: 0, key: "male", label: "Hommes" },
      { count: 0, key: "other", label: "Autres" },
      { count: 0, key: "unknown", label: "Non renseigne" },
    ],
    total: 0,
  };
}

function normalizeMemberStats(stats: MemberListStats | undefined): MemberListStats {
  const fallback = emptyMemberStats();
  if (!stats) {
    return fallback;
  }

  return {
    by_age_range: Array.isArray(stats.by_age_range) ? stats.by_age_range : fallback.by_age_range,
    by_gender: Array.isArray(stats.by_gender) ? stats.by_gender : fallback.by_gender,
    total: typeof stats.total === "number" ? stats.total : fallback.total,
  };
}

function roleVisibilityHint(role: string): string {
  if (role === "pf") {
    return "PF : région personnelle appliquée par défaut. Utilisez le filtre région pour élargir la vue.";
  }
  if (role === "member") {
    return "Membre: lecture réseau autorisée. Région personnelle appliquée par défaut, filtres ouverts sur toutes les régions.";
  }
  if (role === "admin" || role === "ca" || role === "cn") {
    return "RLS gouvernance : vue élargie sur plusieurs membres.";
  }
  return "RLS membre : seuls vos enregistrements sont visibles.";
}

function roleLabel(role: string): string {
  if (role === "admin") return "admin";
  if (role === "ca") return "ca";
  if (role === "cn") return "cn";
  if (role === "pf") return "pf";
  return "member";
}

export default async function MembersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = paramValue(params.q).trim();
  const status = paramValue(params.status);
  const gender = paramValue(params.gender);
  const ageRange = paramValue(params.age_range);
  const requestedRegionId = paramValue(params.region_id);
  const hasExplicitRegionFilter = Object.prototype.hasOwnProperty.call(params, "region_id");
  const prefectureId = paramValue(params.prefecture_id);
  const communeId = paramValue(params.commune_id);
  const organisationId = paramValue(params.organisation_id);
  const sort = paramValue(params.sort) || "created_desc";
  const page = parsePositiveInt(paramValue(params.page), 1);
  const pageSize = normalizePageSize(parsePositiveInt(paramValue(params.page_size), 10));

  let loadError: string | null = null;
  let members = [] as Awaited<ReturnType<typeof listMembers>>["rows"];
  let totalCount = 0;
  let regions = [] as Awaited<ReturnType<typeof getLocations>>["regions"];
  let prefectures = [] as Awaited<ReturnType<typeof getLocations>>["prefectures"];
  let communes = [] as Awaited<ReturnType<typeof getLocations>>["communes"];
  let organisations = [] as Awaited<ReturnType<typeof listOrganisations>>["items"];
  let stats = emptyMemberStats();
  let currentRole = "member";
  let effectiveRegionId = requestedRegionId;

  if (isSupabaseConfigured) {
    try {
      const user = await getCurrentUser();
      if (user) {
        const currentProfileRole = await getCurrentProfileRole();
        if (currentProfileRole) {
          currentRole = currentProfileRole.trim().toLowerCase();
        }

        if ((currentRole === "pf" || currentRole === "member") && !hasExplicitRegionFilter) {
          const currentMember = await getCurrentMember();
          effectiveRegionId = String(currentMember?.region_id ?? "");
        }
      }

      const [locationData, organisationData, memberData] = await Promise.all([
        getLocations(),
        listOrganisations(),
        listMembers({
          age_range: ageRange || undefined,
          commune_id: communeId || undefined,
          gender: gender || undefined,
          organisation_id: organisationId || undefined,
          page,
          page_size: pageSize,
          prefecture_id: prefectureId || undefined,
          q: query || undefined,
          region_id: effectiveRegionId || undefined,
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
      organisations = organisationData.items;
      members = memberData.rows;
      totalCount = memberData.count;
      stats = normalizeMemberStats(memberData.stats);
    } catch (error) {
      console.error("Unable to load member list", error);
      loadError = "Impossible de charger la liste des membres.";
    }
  }

  const availablePrefectures = effectiveRegionId
    ? prefectures.filter((prefecture) => String(prefecture.region_id) === effectiveRegionId)
    : prefectures;
  const availableCommunes = prefectureId
    ? communes.filter((commune) => String(commune.prefecture_id) === prefectureId)
    : communes;

  const regionsById = new Map(regions.map((region) => [String(region.id), region.name]));
  const prefecturesById = new Map(
    prefectures.map((prefecture) => [String(prefecture.id), prefecture.name]),
  );
  const communesById = new Map(communes.map((commune) => [String(commune.id), commune.name]));
  const organisationsById = new Map(
    organisations.map((organisation) => [String(organisation.id), organisation.name]),
  );
  const genderStatsByKey = new Map(stats.by_gender.map((bucket) => [bucket.key, bucket.count]));
  const ageStatsByKey = new Map(stats.by_age_range.map((bucket) => [bucket.key, bucket.count]));
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, totalPages);
  const hasPreviousPage = safePage > 1;
  const hasNextPage = safePage < totalPages;
  const canValidateMember =
    currentRole === "admin" || currentRole === "ca" || currentRole === "cn" || currentRole === "pf";
  const canManageRoles = currentRole === "admin" || currentRole === "ca";

  function buildPageHref(nextPage: number): string {
    const urlParams = new URLSearchParams();
    if (query) urlParams.set("q", query);
    if (status) urlParams.set("status", status);
    if (gender) urlParams.set("gender", gender);
    if (ageRange) urlParams.set("age_range", ageRange);
    if (effectiveRegionId || hasExplicitRegionFilter) {
      urlParams.set("region_id", effectiveRegionId);
    }
    if (prefectureId) urlParams.set("prefecture_id", prefectureId);
    if (communeId) urlParams.set("commune_id", communeId);
    if (organisationId) urlParams.set("organisation_id", organisationId);
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
      {/* Page header banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-[#0a8ea8] px-6 py-5 text-white shadow-md">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">Gestion</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">Membres CZI</h2>
            <p className="mt-1 text-sm text-white/75">{roleVisibilityHint(currentRole)}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold">
              Rôle : {roleLabel(currentRole)}
            </span>
            {currentRole !== "member" ? (
              <Link href="/app/membres">
                <Button variant="secondary" size="sm">Réinitialiser</Button>
              </Link>
            ) : null}
          </div>
        </div>
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
      </div>

      {/* Stats overview */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface-elevated px-5 py-4 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Total</p>
          <p className="mt-1.5 text-3xl font-bold text-foreground">{totalCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface-elevated px-5 py-4 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Actifs</p>
          <p className="mt-1.5 text-3xl font-bold text-emerald-600">
            {stats.by_gender.reduce((s, b) => s + b.count, 0) > 0 ? stats.total : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface-elevated px-5 py-4 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">Femmes</p>
          <p className="mt-1.5 text-3xl font-bold text-violet-600">{genderStatsByKey.get("female") ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface-elevated px-5 py-4 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Hommes</p>
          <p className="mt-1.5 text-3xl font-bold text-blue-600">{genderStatsByKey.get("male") ?? 0}</p>
        </div>
      </section>

      <Card className="space-y-4">
        <CardTitle className="text-base">Recherche & filtres</CardTitle>
        <form className="grid gap-3 md:grid-cols-9" method="get">
          <Input defaultValue={query} name="q" placeholder="Nom, email, téléphone..." />
          <Select defaultValue={status} name="status">
            <option value="">Tous statuts</option>
            <option value="active">Actif</option>
            <option value="pending">En attente</option>
            <option value="rejected">Rejeté</option>
            <option value="suspended">Suspendu</option>
          </Select>
          <Select defaultValue={gender} name="gender">
            <option value="">Tous genres</option>
            <option value="female">Femmes</option>
            <option value="male">Hommes</option>
            <option value="other">Autres</option>
          </Select>
          <Select defaultValue={ageRange} name="age_range">
            <option value="">Tous âges</option>
            <option value="15-19">15-19</option>
            <option value="20-24">20-24</option>
            <option value="25-29">25-29</option>
            <option value="30-35">30-35</option>
            <option value="36+">36+</option>
          </Select>
          <Select defaultValue={effectiveRegionId} name="region_id">
            <option value="">Toutes les régions</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </Select>
          <Select defaultValue={prefectureId} name="prefecture_id">
            <option value="">Toutes les préfectures</option>
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
          <Select defaultValue={organisationId} name="organisation_id">
            <option value="">Toutes organisations</option>
            {organisations.map((organisation) => (
              <option key={organisation.id} value={organisation.id}>
                {organisation.name}
              </option>
            ))}
          </Select>
          <Select defaultValue={sort} name="sort">
            <option value="created_desc">Plus récents</option>
            <option value="created_asc">Plus anciens</option>
            <option value="name_asc">Nom A-Z</option>
            <option value="name_desc">Nom Z-A</option>
            <option value="status_asc">Statut</option>
          </Select>
          <Select defaultValue={String(pageSize)} name="page_size">
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
            <option value="50">50 / page</option>
          </Select>
          <div className="md:col-span-9 flex items-center gap-3">
            <Button type="submit">Appliquer les filtres</Button>
            <p className="text-sm text-muted">{totalCount} résultat(s)</p>
          </div>
        </form>
      </Card>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="space-y-4">
          <div>
            <CardTitle className="text-base">Répartition par genre</CardTitle>
            <CardDescription className="mt-1">Compteurs selon les filtres actifs.</CardDescription>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Femmes", key: "female", color: "text-violet-600" },
              { label: "Hommes", key: "male", color: "text-blue-600" },
              { label: "Autres", key: "other", color: "text-indigo-600" },
              { label: "N/R", key: "unknown", color: "text-muted" },
            ].map(({ label, key, color }) => (
              <div key={key} className="rounded-xl border border-border bg-muted-surface/40 px-4 py-3 text-center">
                <p className={`text-2xl font-bold ${color}`}>{genderStatsByKey.get(key) ?? 0}</p>
                <p className="mt-0.5 text-xs text-muted">{label}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <CardTitle className="text-base">Répartition par tranche d&apos;âge</CardTitle>
            <CardDescription className="mt-1">Tranches calculées lors de l&apos;onboarding.</CardDescription>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "15-19", key: "15-19" },
              { label: "20-24", key: "20-24" },
              { label: "25-29", key: "25-29" },
              { label: "30-35", key: "30-35" },
              { label: "36+", key: "36+" },
              { label: "N/R", key: "unknown" },
            ].map(({ label, key }) => (
              <div key={key} className="rounded-xl border border-border bg-muted-surface/40 px-4 py-3 text-center">
                <p className="text-2xl font-bold text-foreground">{ageStatsByKey.get(key) ?? 0}</p>
                <p className="mt-0.5 text-xs text-muted">{label}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead>
              <tr className="border-b border-border bg-muted-surface/60">
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-muted">ID</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-muted">Nom</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-muted">Contact</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-muted">Localisation</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-muted">Organisation</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-muted">Statut</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!isSupabaseConfigured ? (
                <tr>
                  <td className="px-4 py-8 text-sm text-muted" colSpan={7}>
                    Configurez Supabase pour charger les données membres.
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td className="px-4 py-8 text-sm text-red-600" colSpan={7}>{loadError}</td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-muted" colSpan={7}>
                    Aucun membre ne correspond aux filtres.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="border-t border-border transition-colors hover:bg-muted-surface/40">
                    <td className="px-4 py-3 text-xs font-mono text-muted">{member.id}</td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {[member.first_name, member.last_name].filter(Boolean).join(" ") || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted">
                      {member.phone ? (
                        <MemberContactLink channel="phone" className="hover:text-foreground hover:underline" memberId={member.id} source="members_list" href={`tel:${member.phone.replace(/\s+/g, "")}`}>
                          {member.phone}
                        </MemberContactLink>
                      ) : "-"}
                      <br />
                      {member.email ? (
                        <MemberContactLink channel="email" className="hover:text-foreground hover:underline" memberId={member.id} source="members_list" href={`mailto:${member.email}`}>
                          {member.email}
                        </MemberContactLink>
                      ) : "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {[
                        regionsById.get(String(member.region_id)),
                        prefecturesById.get(String(member.prefecture_id)),
                        communesById.get(String(member.commune_id)),
                      ].filter(Boolean).join(" / ") || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted">
                      {organisationsById.get(String(member.organisation_id)) ?? member.org_name ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(member.status)}>{member.status ?? "unknown"}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/app/membres/${member.id}`}>
                          <Button size="xs" variant="primary">Ouvrir</Button>
                        </Link>
                        {canValidateMember && member.status === "pending" ? (
                          <Link href={`/app/membres/${member.id}#validation-membre`}>
                            <Button size="xs" variant="outline">Valider</Button>
                          </Link>
                        ) : null}
                        {member.email ? (
                          <MemberContactLink channel="email" className="text-xs font-medium text-muted hover:text-foreground" memberId={member.id} source="members_list" href={`mailto:${member.email}`}>
                            Email
                          </MemberContactLink>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex items-center justify-between rounded-xl border border-border bg-surface-elevated px-5 py-3 shadow-xs">
        <p className="text-sm text-muted">
          Page <span className="font-semibold text-foreground">{safePage}</span> / {totalPages}
          <span className="mx-2 text-border">·</span>
          {startItem}–{endItem} sur <span className="font-semibold text-foreground">{totalCount}</span>
        </p>
        <div className="flex gap-2">
          <Link href={buildPageHref(Math.max(1, safePage - 1))}>
            <Button disabled={!hasPreviousPage} size="sm" variant="secondary">← Précédent</Button>
          </Link>
          <Link href={buildPageHref(Math.min(totalPages, safePage + 1))}>
            <Button disabled={!hasNextPage} size="sm" variant="secondary">Suivant →</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
