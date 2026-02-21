import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getDashboardOverview } from "@/lib/backend/api";
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

  if (isSupabaseConfigured) {
    try {
      const overview = await getDashboardOverview();
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

        const [
          allMembersResult,
          activeMembersResult,
          pendingMembersResult,
          suspendedMembersResult,
        ] =
          await Promise.all([
            supabase.from("member").select("id", { count: "exact" }).limit(1),
            supabase
              .from("member")
              .select("id", { count: "exact" })
              .eq("status", "active")
              .limit(1),
            supabase
              .from("member")
              .select("id", { count: "exact" })
              .eq("status", "pending")
              .limit(1),
            supabase
              .from("member")
              .select("id", { count: "exact" })
              .eq("status", "suspended")
              .limit(1),
          ]);

        if (allMembersResult.error) throw allMembersResult.error;
        if (activeMembersResult.error) throw activeMembersResult.error;
        if (pendingMembersResult.error) throw pendingMembersResult.error;
        if (suspendedMembersResult.error) throw suspendedMembersResult.error;

        const allMembers = allMembersResult.count ?? 0;
        const activeMembers = activeMembersResult.count ?? 0;
        const pendingMembers = pendingMembersResult.count ?? 0;
        const suspendedMembers = suspendedMembersResult.count ?? 0;

        kpis = [
          {
            label: "Membres visibles",
            value: String(allMembers),
            trend: "Mode secours",
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
        loadNotice = "Indicateurs backend indisponibles. Mode secours Supabase actif.";
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
      <Card>
        <CardTitle>Prochaine etape</CardTitle>
        <CardDescription className="mt-2">
          Connecter les metriques de gouvernance avancees (CA / CN / PF) apres validation des
          roles metier.
        </CardDescription>
      </Card>
    </div>
  );
}
