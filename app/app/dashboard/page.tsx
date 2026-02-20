import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const kpis = [
  { label: "Membres actifs", value: "128", trend: "+8 ce mois" },
  { label: "Demandes en attente", value: "14", trend: "A traiter" },
  { label: "Mandats en cours", value: "37", trend: "CA / CN / PF" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Dashboard</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">Vue d&apos;ensemble</h2>
      </div>
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
          Brancher les donnees Supabase (session, membres, statistiques de gouvernance).
        </CardDescription>
      </Card>
    </div>
  );
}
