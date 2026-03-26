import Link from "next/link";
import {
  Users,
  Clock,
  ShieldAlert,
  CreditCard,
  TrendingUp,
  MessageSquare,
  HandCoins,
  FolderOpen,
  ArrowRight,
  UserCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, StatCard, CardTitle, CardDescription } from "@/components/ui/card";
import { getDashboardOverview } from "@/lib/backend/api";
import { getCurrentMemberCardOverview } from "@/lib/supabase/member-card";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type DashboardKpi = {
  label: string;
  trend: string;
  value: string;
  accent: "primary" | "warning" | "danger" | "success";
  icon: React.ReactNode;
};

const quickLinks = [
  { href: "/app/membres",    icon: Users,          label: "Membres",          desc: "Gérer les membres" },
  { href: "/app/communaute", icon: MessageSquare,  label: "Communauté",       desc: "Discussions & groupes" },
  { href: "/app/dons",       icon: HandCoins,      label: "Dons",             desc: "Suivi des dons" },
  { href: "/app/projets",    icon: FolderOpen,     label: "Projets",          desc: "Projets en cours" },
];

export default async function DashboardPage() {
  let kpis: DashboardKpi[] = [
    { label: "Membres visibles",    value: "—", trend: "Chargement…",  accent: "primary", icon: <Users size={20} /> },
    { label: "En attente",          value: "—", trend: "À traiter",    accent: "warning", icon: <Clock size={20} /> },
    { label: "Comptes suspendus",   value: "—", trend: "Surveillance", accent: "danger",  icon: <ShieldAlert size={20} /> },
    { label: "Membres actifs",      value: "—", trend: "Validés",      accent: "success", icon: <UserCheck size={20} /> },
  ];
  let loadError: string | null = null;
  let loadNotice: string | null = null;
  let cardRequestLabel = "Configurer ma carte";
  let cardRequestHint = "Ajoutez la photo, le mode de remise et la demande depuis l'espace carte.";
  let cardIsReady = false;

  if (isSupabaseConfigured) {
    try {
      const [overviewResult, memberCardResult] = await Promise.allSettled([
        getDashboardOverview(),
        getCurrentMemberCardOverview(),
      ]);
      const memberCardOverview = memberCardResult.status === "fulfilled" ? memberCardResult.value : null;

      if (overviewResult.status !== "fulfilled") throw overviewResult.reason;

      const overview = overviewResult.value;

      if (memberCardOverview?.member) {
        if (memberCardOverview.request?.requested) {
          cardRequestLabel = "Suivre ma carte";
          cardIsReady = memberCardOverview.request.card_status === "ready";
          cardRequestHint = cardIsReady
            ? "Votre carte est prête. Téléchargez-la dès maintenant."
            : `Statut : ${memberCardOverview.request.card_status} / paiement ${memberCardOverview.request.payment_status}.`;
        } else {
          cardRequestHint = "La demande de carte est disponible depuis votre espace membre.";
        }
      } else {
        cardRequestLabel = "Compléter ma fiche membre";
        cardRequestHint = "La carte membre devient accessible après la création de votre fiche.";
      }

      kpis = [
        {
          label:  "Membres visibles",
          value:  String(overview.total_members),
          trend:  `+${overview.trend_new_this_month} ce mois`,
          accent: "primary",
          icon:   <Users size={20} />,
        },
        {
          label:  "En attente",
          value:  String(overview.pending_members),
          trend:  "À valider",
          accent: "warning",
          icon:   <Clock size={20} />,
        },
        {
          label:  "Comptes suspendus",
          value:  String(overview.suspended_members),
          trend:  "Sous surveillance",
          accent: "danger",
          icon:   <ShieldAlert size={20} />,
        },
        {
          label:  "Membres actifs",
          value:  String(overview.active_members),
          trend:  "Validés",
          accent: "success",
          icon:   <UserCheck size={20} />,
        },
      ];
    } catch (error) {
      console.error("Dashboard overview error", error);
      try {
        const supabase = await createClient();
        const { data: members, error: membersError } = await supabase
          .from("member")
          .select("status, created_at");
        if (membersError) throw membersError;

        const rows = members ?? [];
        const monthStart = new Date();
        monthStart.setUTCDate(1);
        monthStart.setUTCHours(0, 0, 0, 0);

        const statusCounts = new Map<string, number>();
        let createdThisMonth = 0;
        for (const row of rows) {
          const s = typeof row.status === "string" ? row.status.trim().toLowerCase() : "";
          if (s) statusCounts.set(s, (statusCounts.get(s) ?? 0) + 1);
          if (row.created_at && new Date(row.created_at) >= monthStart) createdThisMonth++;
        }

        const pending   = (statusCounts.get("pending") ?? 0) + (statusCounts.get("en_attente") ?? 0);
        const suspended = (statusCounts.get("suspended") ?? 0) + (statusCounts.get("suspendu") ?? 0);
        const active    = (statusCounts.get("active") ?? 0) + (statusCounts.get("valide") ?? 0) || Math.max(rows.length - pending - suspended, 0);

        kpis = [
          { label: "Membres visibles",  value: String(rows.length), trend: `+${createdThisMonth} ce mois`, accent: "primary", icon: <Users size={20} /> },
          { label: "En attente",        value: String(pending),     trend: "À valider",       accent: "warning", icon: <Clock size={20} /> },
          { label: "Comptes suspendus", value: String(suspended),   trend: "Sous surveillance", accent: "danger", icon: <ShieldAlert size={20} /> },
          { label: "Membres actifs",    value: String(active),      trend: "Validés",         accent: "success", icon: <UserCheck size={20} /> },
        ];
        loadNotice = "Mode secours actif — indicateurs chargés directement depuis Supabase.";
      } catch (fallbackError) {
        console.error("Dashboard fallback error", fallbackError);
        loadError = "Impossible de charger les indicateurs du tableau de bord.";
      }
    }
  }

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-[#0a8ea8] px-6 py-6 text-white shadow-md">
        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">Tableau de bord</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Vue d&apos;ensemble</h2>
          <p className="mt-1 text-sm text-white/75">
            Bienvenue sur la plateforme Collectif Zéro Indigent.
          </p>
        </div>
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -right-2 bottom-0 h-24 w-24 rounded-full bg-white/5" />
        <TrendingUp className="pointer-events-none absolute right-6 bottom-4 text-white/20" size={80} />
      </div>

      {/* Alerts */}
      {loadError ? (
        <Card className="border-red-200 bg-red-50">
          <CardDescription className="text-red-700">{loadError}</CardDescription>
        </Card>
      ) : null}
      {loadNotice ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardDescription className="text-amber-700">{loadNotice}</CardDescription>
        </Card>
      ) : null}

      {/* KPI grid */}
      <section className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <StatCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            trend={kpi.trend}
            accent={kpi.accent}
            icon={kpi.icon}
          />
        ))}
      </section>

      {/* Quick links */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-muted">Accès rapides</h3>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <div className="group flex items-center gap-3 rounded-xl border border-border bg-surface-elevated px-4 py-3.5 shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <Icon size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{link.label}</p>
                    <p className="text-xs text-muted">{link.desc}</p>
                  </div>
                  <ArrowRight className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" size={14} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Carte membre CTA */}
      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CreditCard size={22} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">Carte membre</p>
              <CardTitle className="mt-1">Carte de membre CZI</CardTitle>
              <CardDescription className="mt-1">{cardRequestHint}</CardDescription>
            </div>
          </div>
          <Link href={cardRequestLabel === "Compléter ma fiche membre" ? "/onboarding" : "/app/carte-membre"}>
            <Button variant={cardIsReady ? "success" : "primary"} className="gap-2 shrink-0">
              <CreditCard size={15} />
              {cardRequestLabel}
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
