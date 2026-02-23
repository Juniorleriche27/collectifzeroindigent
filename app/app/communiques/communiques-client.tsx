"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { Megaphone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type {
  AnnouncementItem,
  CommuneOption,
  PrefectureOption,
  RegionOption,
  ScopeLevel,
} from "@/lib/backend/api";

import { createCommuniqueAction } from "./actions";
import type { CommuniqueCreateState } from "./actions";

type CommuniquesClientProps = {
  canManage: boolean;
  communes: CommuneOption[];
  initialQuery: string;
  items: AnnouncementItem[];
  loadError: string | null;
  prefectures: PrefectureOption[];
  regions: RegionOption[];
  role: string | null;
};

function scopeLabel(
  scope: {
    commune_id: string | null;
    prefecture_id: string | null;
    region_id: string | null;
    scope_type: ScopeLevel;
  },
  maps: {
    communes: Map<string, string>;
    prefectures: Map<string, string>;
    regions: Map<string, string>;
  },
): string {
  if (scope.scope_type === "all") return "National";
  if (scope.scope_type === "region") return `Region: ${maps.regions.get(String(scope.region_id)) ?? "-"}`;
  if (scope.scope_type === "prefecture") {
    return `Prefecture: ${maps.prefectures.get(String(scope.prefecture_id)) ?? "-"}`;
  }
  return `Commune: ${maps.communes.get(String(scope.commune_id)) ?? "-"}`;
}

export function CommuniquesClient({
  canManage,
  communes,
  initialQuery,
  items,
  loadError,
  prefectures,
  regions,
  role,
}: CommuniquesClientProps) {
  const initialState: CommuniqueCreateState = { error: null, success: null };
  const [createState, createAction, createPending] = useActionState(
    createCommuniqueAction,
    initialState,
  );
  const [open, setOpen] = useState(false);
  const [scopeType, setScopeType] = useState<ScopeLevel>("all");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedPrefecture, setSelectedPrefecture] = useState("");

  const maps = useMemo(
    () => ({
      communes: new Map(communes.map((item) => [String(item.id), item.name])),
      prefectures: new Map(prefectures.map((item) => [String(item.id), item.name])),
      regions: new Map(regions.map((item) => [String(item.id), item.name])),
    }),
    [communes, prefectures, regions],
  );
  const prefectureToRegion = useMemo(
    () => new Map(prefectures.map((item) => [String(item.id), String(item.region_id)])),
    [prefectures],
  );
  const communeToPrefecture = useMemo(
    () => new Map(communes.map((item) => [String(item.id), String(item.prefecture_id)])),
    [communes],
  );

  const availablePrefectures = selectedRegion
    ? prefectures.filter((item) => String(item.region_id) === selectedRegion)
    : prefectures;
  const availableCommunes = selectedPrefecture
    ? communes.filter((item) => String(item.prefecture_id) === selectedPrefecture)
    : selectedRegion
      ? communes.filter(
          (item) => prefectureToRegion.get(String(item.prefecture_id)) === selectedRegion,
        )
      : communes;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Communiques</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">Diffusion CZI</h2>
          <CardDescription className="mt-2">
            Publication d&apos;annonces ciblees: national, region, prefecture ou commune.
          </CardDescription>
        </div>
        <Button disabled={!canManage} onClick={() => setOpen(true)}>
          Nouveau communique
        </Button>
      </div>

      {!canManage ? (
        <Card>
          <CardDescription className="text-amber-700">
            Ecriture reservee a l&apos;equipe communication, CA, CN, PF ou admin. Role detecte:{" "}
            {role ?? "member"}.
          </CardDescription>
        </Card>
      ) : null}

      <Card className="space-y-3">
        <CardTitle className="text-base">Recherche</CardTitle>
        <form className="flex flex-wrap items-center gap-3" method="get">
          <Input
            className="min-w-[280px] flex-1"
            defaultValue={initialQuery}
            name="q"
            placeholder="Titre ou contenu..."
          />
          <Button type="submit" variant="secondary">
            Rechercher
          </Button>
          <Link href="/app/communiques">
            <Button type="button" variant="ghost">
              Reinitialiser
            </Button>
          </Link>
        </form>
        <CardDescription>{items.length} communique(s) visible(s).</CardDescription>
      </Card>

      {loadError ? (
        <Card>
          <CardDescription className="text-red-600">{loadError}</CardDescription>
        </Card>
      ) : items.length === 0 ? (
        <Card className="flex min-h-[220px] flex-col items-center justify-center text-center">
          <div className="rounded-full bg-muted-surface p-4 text-muted">
            <Megaphone size={30} />
          </div>
          <CardTitle className="mt-4">Aucun communique pour le moment</CardTitle>
          <CardDescription className="mt-2">
            Creez votre premier communique pour informer les membres.
          </CardDescription>
        </Card>
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {items.map((item) => (
            <Card key={item.id} className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{item.title}</CardTitle>
                <Badge variant={item.is_published ? "success" : "warning"}>
                  {item.is_published ? "publie" : "brouillon"}
                </Badge>
              </div>
              <CardDescription className="line-clamp-5 whitespace-pre-wrap">{item.body}</CardDescription>
              <div className="flex flex-wrap gap-2">
                {item.scopes.map((scope) => (
                  <Badge
                    className="bg-primary/10 text-primary"
                    key={scope.id ?? `${item.id}-${scope.scope_type}-${scope.created_at ?? ""}`}
                  >
                    {scopeLabel(scope, maps)}
                  </Badge>
                ))}
              </div>
              <CardDescription>
                Cree le {new Date(item.created_at).toLocaleString("fr-FR")}
              </CardDescription>
            </Card>
          ))}
        </section>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-2xl space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle>Nouveau communique</CardTitle>
              <Button size="sm" type="button" variant="ghost" onClick={() => setOpen(false)}>
                Fermer
              </Button>
            </div>
            <form action={createAction} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium" htmlFor="communique-title">
                  Titre
                </label>
                <Input id="communique-title" name="title" placeholder="Titre du communique" required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium" htmlFor="communique-body">
                  Contenu
                </label>
                <textarea
                  className="min-h-[140px] w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/20"
                  id="communique-body"
                  name="body"
                  placeholder="Ecrivez votre annonce..."
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="communique-scope-type">
                  Portee
                </label>
                <Select
                  value={scopeType}
                  id="communique-scope-type"
                  name="scope_type"
                  onChange={(event) => {
                    const nextScope = event.target.value as ScopeLevel;
                    setScopeType(nextScope);
                    if (nextScope === "all") {
                      setSelectedRegion("");
                      setSelectedPrefecture("");
                    } else if (nextScope === "region") {
                      setSelectedPrefecture("");
                    }
                  }}
                >
                  <option value="all">National</option>
                  <option value="region">Par region</option>
                  <option value="prefecture">Par prefecture</option>
                  <option value="commune">Par commune</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="communique-is-published">
                  Publication
                </label>
                <Select defaultValue="true" id="communique-is-published" name="is_published">
                  <option value="true">Publier maintenant</option>
                  <option value="false">Enregistrer en brouillon</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="communique-region">
                  Region
                </label>
                <Select
                  disabled={scopeType === "all"}
                  id="communique-region"
                  name="region_id"
                  onChange={(event) => {
                    setSelectedRegion(event.target.value);
                    setSelectedPrefecture("");
                  }}
                >
                  <option value="">Selectionner une region</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="communique-prefecture">
                  Prefecture
                </label>
                <Select
                  disabled={scopeType === "all"}
                  id="communique-prefecture"
                  name="prefecture_id"
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelectedPrefecture(value);
                    if (value && scopeType === "region") {
                      setScopeType("prefecture");
                    }
                  }}
                >
                  <option value="">Selectionner une prefecture</option>
                  {availablePrefectures.map((prefecture) => (
                    <option key={prefecture.id} value={prefecture.id}>
                      {prefecture.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium" htmlFor="communique-commune">
                  Commune
                </label>
                <Select
                  disabled={scopeType === "all"}
                  id="communique-commune"
                  name="commune_id"
                  onChange={(event) => {
                    const value = event.target.value;
                    if (!value) return;
                    const parentPrefecture = communeToPrefecture.get(value);
                    if (parentPrefecture) {
                      setSelectedPrefecture(parentPrefecture);
                      const parentRegion = prefectureToRegion.get(parentPrefecture);
                      if (parentRegion) {
                        setSelectedRegion(parentRegion);
                      }
                    }
                    if (scopeType !== "commune") {
                      setScopeType("commune");
                    }
                  }}
                >
                  <option value="">Selectionner une commune</option>
                  {availableCommunes.map((commune) => (
                    <option key={commune.id} value={commune.id}>
                      {commune.name}
                    </option>
                  ))}
                </Select>
              </div>
              {createState.error ? (
                <p className="text-sm text-red-600 md:col-span-2">{createState.error}</p>
              ) : null}
              {createState.success ? (
                <p className="text-sm text-emerald-700 md:col-span-2">{createState.success}</p>
              ) : null}
              <div className="md:col-span-2">
                <Button disabled={createPending} type="submit">
                  {createPending ? "Publication..." : "Publier le communique"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
