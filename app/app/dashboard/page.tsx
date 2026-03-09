import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getDashboardOverview } from "@/lib/backend/api";
import { getCurrentMemberCardOverview } from "@/lib/supabase/member-card";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type DashboardKpi = {
  label: string;
  trend: string;
  value: string;
};

export default async function DashboardPage() {
  let kpis: DashboardKpi[] = [
    { label: "Membres visibles", value: "0", trend: "RLS actif" },
    { label: "Demandes en attente", value: "0", trend: "A traiter" },
    { label: "Comptes suspendus", value: "0", trend: "Surveillance" },
  ];
  let loadError: string | null = null;
  let loadNotice: string | null = null;
  let cardRequestLabel = "Configurer ma carte";
  let cardRequestHint = "Ajoutez photo, remise et demande membre depuis l'espace carte.";

  if (isSupabaseConfigured) {
    try {
      const [overviewResult, memberCardResult] = await Promise.allSettled([
        getDashboardOverview(),
        getCurrentMemberCardOverview(),
      ]);
      const memberCardOverview =
        memberCardResult.status === "fulfilled" ? memberCardResult.value : null;

      if (overviewResult.status !== "fulfilled") {
        throw overviewResult.reason;
      }

      const overview = overviewResult.value;

      if (memberCardOverview?.member) {
        if (memberCardOverview.request?.requested) {
          cardRequestLabel = "Suivre ma carte";
          cardRequestHint = `Statut actuel: ${memberCardOverview.request.card_status} / paiement ${memberCardOverview.request.payment_status}.`;
        } else {
          cardRequestHint = "La demande de carte est disponible depuis votre espace membre.";
        }
      } else {
        cardRequestLabel = "Terminer mon onboarding";
        cardRequestHint = "La carte membre devient accessible juste apres la creation de la fiche.";
      }
      kpis = [
        {
          label: "Membres visibles",
          value: String(overview.total_members),
          trend: `+${overview.trend_new_this_month} ce mois`,
        },
        {
          label: "Demandes en attente",
          value: String(overview.pending_members),
          trend: "A traiter",
        },
        {
          label: "Comptes suspendus",
          value: String(overview.suspended_members),
          trend: `${overview.active_members} actifs`,
        },
      ];
    } catch (error) {
      console.error("Unable to load dashboard overview endpoint", error);
      try {
        const supabase = await createClient();
        const { data: members, error: membersError } = await supabase
          .from("member")
          .select("status, created_at");
        if (membersError) {
          throw membersError;
        }

        const rows = members ?? [];
        const allMembers = rows.length;
        const statusCounts = new Map<string, number>();
        let createdThisMonth = 0;
        const monthStart = new Date();
        monthStart.setUTCDate(1);
        monthStart.setUTCHours(0, 0, 0, 0);

        for (const row of rows) {
          const status = typeof row.status === "string" ? row.status.trim().toLowerCase() : "";
          if (status) {
            statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
          }
          if (row.created_at) {
            const createdAt = new Date(row.created_at);
            if (!Number.isNaN(createdAt.getTime()) && createdAt >= monthStart) {
              createdThisMonth += 1;
            }
          }
        }

        const pendingMembers =
          (statusCounts.get("pending") ?? 0) +
          (statusCounts.get("en_attente") ?? 0) +
          (statusCounts.get("waiting") ?? 0);
        const suspendedMembers =
          (statusCounts.get("suspended") ?? 0) +
          (statusCounts.get("suspendu") ?? 0) +
          (statusCounts.get("blocked") ?? 0);
        const activeMembers =
          (statusCounts.get("active") ?? 0) +
            (statusCounts.get("approved") ?? 0) +
            (statusCounts.get("validated") ?? 0) +
            (statusCounts.get("valide") ?? 0) ||
          Math.max(allMembers - pendingMembers - suspendedMembers, 0);

        kpis = [
          {
            label: "Membres visibles",
            value: String(allMembers),
            trend: `+${createdThisMonth} ce mois`,
          },
          {
            label: "Demandes en attente",
            value: String(pendingMembers),
            trend: "A traiter",
          },
          {
            label: "Comptes suspendus",
            value: String(suspendedMembers),
            trend: `${activeMembers} actifs`,
          },
        ];
        loadNotice = "Indicateurs backend indisponibles. Mode secours Supabase actif (RLS).";
      } catch (fallbackError) {
        console.error("Unable to load dashboard fallback metrics", fallbackError);
        loadError = "Impossible de charger les indicateurs dashboard.";
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Dashboard</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">Vue d&apos;ensemble</h2>
      </div>
      {loadError ? (
        <Card>
          <CardDescription className="text-red-600">{loadError}</CardDescription>
        </Card>
      ) : null}
      {loadNotice ? (
        <Card>
          <CardDescription className="text-amber-700">{loadNotice}</CardDescription>
        </Card>
      ) : null}
      <section className="grid gap-4 md:grid-cols-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardDescription>{kpi.label}</CardDescription>
            <CardTitle className="mt-2 text-3xl">{kpi.value}</CardTitle>
            <p className="mt-2 text-sm text-muted">{kpi.trend}</p>
          </Card>
        ))}
      </section>
      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Carte membre
          </p>
          <CardTitle className="mt-2">Activez la carte CZI</CardTitle>
          <CardDescription className="mt-2">{cardRequestHint}</CardDescription>
        </div>
        <Link href={cardRequestLabel === "Terminer mon onboarding" ? "/onboarding" : "/app/carte-membre"}>
          <Button>{cardRequestLabel}</Button>
        </Link>
      </Card>
    </div>
  );
}
