"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { Mail } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type {
  CommuneOption,
  EmailCampaignItem,
  PrefectureOption,
  RegionOption,
  ScopeLevel,
} from "@/lib/backend/api";

import {
  createEmailCampaignAction,
  queueEmailCampaignAction,
  sendEmailCampaignAction,
} from "./actions";
import type { EmailCampaignActionState } from "./actions";

type CampagnesEmailClientProps = {
  communes: CommuneOption[];
  initialQuery: string;
  items: EmailCampaignItem[];
  loadError: string | null;
  prefectures: PrefectureOption[];
  regions: RegionOption[];
  role: string | null;
};

function statusVariant(status: string): "default" | "success" | "warning" | "danger" {
  if (status === "sent") return "success";
  if (status === "queued") return "warning";
  if (status === "failed") return "danger";
  return "default";
}

function scopeText(
  item: {
    audience_scope: ScopeLevel;
    commune_id: string | null;
    prefecture_id: string | null;
    region_id: string | null;
  },
  maps: {
    communes: Map<string, string>;
    prefectures: Map<string, string>;
    regions: Map<string, string>;
  },
): string {
  if (item.audience_scope === "all") return "Tous les membres";
  if (item.audience_scope === "region") {
    return `Region: ${maps.regions.get(String(item.region_id)) ?? "-"}`;
  }
  if (item.audience_scope === "prefecture") {
    return `Prefecture: ${maps.prefectures.get(String(item.prefecture_id)) ?? "-"}`;
  }
  return `Commune: ${maps.communes.get(String(item.commune_id)) ?? "-"}`;
}

export function CampagnesEmailClient({
  communes,
  initialQuery,
  items,
  loadError,
  prefectures,
  regions,
  role,
}: CampagnesEmailClientProps) {
  const initialState: EmailCampaignActionState = { error: null, success: null };
  const [createState, createAction, createPending] = useActionState(
    createEmailCampaignAction,
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
  const availablePrefectures = selectedRegion
    ? prefectures.filter((item) => String(item.region_id) === selectedRegion)
    : prefectures;
  const availableCommunes = selectedPrefecture
    ? communes.filter((item) => String(item.prefecture_id) === selectedPrefecture)
    : communes;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Campagnes email</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">Diffusion en masse</h2>
          <CardDescription className="mt-2">
            Envoi cible a toutes les regions, ou par region/prefecture/commune.
          </CardDescription>
        </div>
        <Button onClick={() => setOpen(true)}>Nouvelle campagne</Button>
      </div>

      {role ? (
        <Card>
          <CardDescription>
            Role actif: <span className="font-semibold text-foreground">{role}</span>
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
            placeholder="Sujet campagne..."
          />
          <Button type="submit" variant="secondary">
            Rechercher
          </Button>
          <Link href="/app/campagnes-email">
            <Button type="button" variant="ghost">
              Reinitialiser
            </Button>
          </Link>
        </form>
      </Card>

      {loadError ? (
        <Card>
          <CardDescription className="text-red-600">{loadError}</CardDescription>
        </Card>
      ) : items.length === 0 ? (
        <Card className="flex min-h-[220px] flex-col items-center justify-center text-center">
          <div className="rounded-full bg-muted-surface p-4 text-muted">
            <Mail size={30} />
          </div>
          <CardTitle className="mt-4">Aucune campagne</CardTitle>
          <CardDescription className="mt-2">
            Creer une campagne pour communiquer rapidement avec le reseau.
          </CardDescription>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[1100px] text-left">
            <thead className="bg-muted-surface">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                  Sujet
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                  Cible
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                  Statut
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                  Destinataires
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                  Creee le
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr className="border-t border-border" key={item.id}>
                  <td className="px-4 py-3 text-sm">
                    <p className="font-semibold">{item.subject}</p>
                    <p className="mt-1 text-xs text-muted line-clamp-2">{item.body}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">{scopeText(item, maps)}</td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">
                    {item.stats.total} total
                    <br />
                    {item.stats.pending} pending / {item.stats.sent} sent
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">
                    {new Date(item.created_at).toLocaleString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      {item.status === "draft" ? (
                        <form action={queueEmailCampaignAction}>
                          <input name="campaign_id" type="hidden" value={item.id} />
                          <Button size="sm" type="submit">
                            Mettre en file
                          </Button>
                        </form>
                      ) : null}
                      {item.status === "queued" ? (
                        <form action={sendEmailCampaignAction}>
                          <input name="campaign_id" type="hidden" value={item.id} />
                          <Button size="sm" type="submit" variant="secondary">
                            Marquer envoye
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-2xl space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle>Nouvelle campagne email</CardTitle>
              <Button size="sm" type="button" variant="ghost" onClick={() => setOpen(false)}>
                Fermer
              </Button>
            </div>
            <form action={createAction} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium" htmlFor="campaign-subject">
                  Sujet
                </label>
                <Input id="campaign-subject" name="subject" placeholder="Sujet du mail" required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium" htmlFor="campaign-body">
                  Message
                </label>
                <textarea
                  className="min-h-[140px] w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/20"
                  id="campaign-body"
                  name="body"
                  placeholder="Corps du message email..."
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="campaign-provider">
                  Provider
                </label>
                <Input
                  defaultValue="resend"
                  id="campaign-provider"
                  name="provider"
                  placeholder="resend / sendgrid / mailgun"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="campaign-scope">
                  Ciblage
                </label>
                <Select
                  defaultValue="all"
                  id="campaign-scope"
                  name="audience_scope"
                  onChange={(event) => setScopeType(event.target.value as ScopeLevel)}
                >
                  <option value="all">Tous les membres</option>
                  <option value="region">Par region</option>
                  <option value="prefecture">Par prefecture</option>
                  <option value="commune">Par commune</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="campaign-region">
                  Region
                </label>
                <Select
                  disabled={scopeType === "all"}
                  id="campaign-region"
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
                <label className="text-sm font-medium" htmlFor="campaign-prefecture">
                  Prefecture
                </label>
                <Select
                  disabled={scopeType === "all" || scopeType === "region"}
                  id="campaign-prefecture"
                  name="prefecture_id"
                  onChange={(event) => setSelectedPrefecture(event.target.value)}
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
                <label className="text-sm font-medium" htmlFor="campaign-commune">
                  Commune
                </label>
                <Select disabled={scopeType !== "commune"} id="campaign-commune" name="commune_id">
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
                  {createPending ? "Creation..." : "Creer la campagne"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
