import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getDashboardOverview, listMembers } from "@/lib/backend/api";
import { isSupabaseConfigured } from "@/lib/supabase/config";

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
        const [allMembers, activeMembers, pendingMembers, suspendedMembers] = await Promise.all([
          listMembers({ page: 1, page_size: 1 }),
          listMembers({ page: 1, page_size: 1, status: "active" }),
          listMembers({ page: 1, page_size: 1, status: "pending" }),
          listMembers({ page: 1, page_size: 1, status: "suspended" }),
        ]);

        kpis = [
          {
            label: "Membres visibles",
            value: String(allMembers.count),
            trend: "Mode compatibilite",
          },
          {
            label: "Demandes en attente",
            value: String(pendingMembers.count),
            trend: "A traiter",
          },
          {
            label: "Comptes suspendus",
            value: String(suspendedMembers.count),
            trend: `${activeMembers.count} actifs`,
          },
        ];
        loadError =
          "Indicateurs avances indisponibles. Affichage en mode compatibilite via la liste membres.";
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
