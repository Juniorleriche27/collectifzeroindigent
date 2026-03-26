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

  const kpiColors = [
    { bar: "#1E88E5", text: "#1E88E5", bg: "rgba(30,136,229,.1)" },
    { bar: "#F9A825", text: "#F9A825", bg: "rgba(249,168,37,.1)" },
    { bar: "#E53935", text: "#E53935", bg: "rgba(229,57,53,.1)" },
    { bar: "#43A047", text: "#43A047", bg: "rgba(67,160,71,.1)" },
  ];

  const quickLinkColors = [
    { color: "#1E88E5", bg: "rgba(30,136,229,.1)" },
    { color: "#00897B", bg: "rgba(0,137,123,.1)" },
    { color: "#F9A825", bg: "rgba(249,168,37,.1)" },
    { color: "#43A047", bg: "rgba(67,160,71,.1)" },
  ];

  const activityItems = [
    { label: "Tableau de bord chargé", sub: "Plateforme en ligne", dot: "#1A8A9B" },
    { label: "Plateforme opérationnelle", sub: "Tous les services actifs", dot: "#43A047" },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[.7rem] font-bold uppercase tracking-[.14em] text-[#7A8CA0]">Principal</p>
          <h1 className="text-xl font-bold text-[#12202E]" style={{ fontFamily: "'Syne', sans-serif" }}>Tableau de bord</h1>
        </div>
        <p className="text-sm text-[#7A8CA0]">
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* ── Hero Banner ─────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl px-8 py-7 text-white shadow-md"
        style={{ background: "linear-gradient(120deg, #0F5F6B 0%, #1A8A9B 60%, #25B4C8 100%)" }}
      >
        {/* diagonal grid overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "repeating-linear-gradient(45deg, rgba(255,255,255,.03) 0, rgba(255,255,255,.03) 1px, transparent 0, transparent 24px)",
          }}
        />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-[.65rem] font-bold uppercase tracking-[.14em] text-white/60 mb-[6px]">
              Principal
            </p>
            <h1 className="text-[1.6rem] font-bold leading-[1.15] text-white mb-[6px]" style={{ fontFamily: "'Syne', sans-serif" }}>
              Vue d&apos;ensemble
            </h1>
            <p className="text-[.85rem] text-white/65">Bienvenue sur la plateforme Collectif Zéro Indigent.</p>
          </div>
          {/* Stat chips in banner */}
          <div className="flex flex-wrap items-center gap-3">
            {kpis.slice(0, 3).map((kpi) => (
              <div key={kpi.label} className="rounded-xl bg-white/15 px-4 py-2 text-center backdrop-blur-sm">
                <p className="text-[1.3rem] font-bold leading-none">{kpi.value}</p>
                <p className="mt-1 text-[.65rem] text-white/70 uppercase tracking-[.1em]">{kpi.label}</p>
              </div>
            ))}
          </div>
        </div>
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

      {/* KPI stat cards row */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, i) => {
          const c = kpiColors[i] ?? kpiColors[0];
          return (
            <div
              key={kpi.label}
              className="relative overflow-hidden rounded-[14px] border border-[#E2E8F0] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              style={{ boxShadow: "0 1px 4px rgba(18,32,46,.06)" }}
            >
              <div style={{ height: 3, background: c.bar, borderRadius: "14px 14px 0 0" }} />
              <div className="flex items-start justify-between p-5">
                <div>
                  <p className="text-[.65rem] font-bold uppercase tracking-[.12em] text-[#7A8CA0] mb-3">{kpi.label}</p>
                  <p className="text-[2.2rem] font-bold leading-none" style={{ color: c.text }}>{kpi.value}</p>
                  <p className="mt-2 text-[.75rem] text-[#7A8CA0]">{kpi.trend}</p>
                </div>
                <div className="h-9 w-9 rounded-[10px] grid place-items-center flex-shrink-0" style={{ background: c.bg }}>
                  <span style={{ color: c.text }}>{kpi.icon}</span>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* 2-column: Quick links + Activity */}
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        {/* Left: Quick links card */}
        <div className="rounded-[14px] border border-[#E2E8F0] bg-white overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(18,32,46,.06)" }}>
          <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-4">
            <h3 className="text-sm font-bold text-[#12202E]">Accès rapides</h3>
            <span className="text-xs text-[#7A8CA0]">{quickLinks.length} modules</span>
          </div>
          <div className="p-5 grid gap-3 sm:grid-cols-2">
            {quickLinks.map((link, i) => {
              const Icon = link.icon;
              const lc = quickLinkColors[i] ?? quickLinkColors[0];
              return (
                <Link key={link.href} href={link.href}>
                  <div className="group flex items-center gap-3 rounded-[10px] border border-[#E2E8F0] bg-[#F0F3F8]/60 px-4 py-3 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#E2E8F0] hover:bg-white hover:shadow-sm">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]" style={{ background: lc.bg }}>
                      <Icon size={17} style={{ color: lc.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#12202E]">{link.label}</p>
                      <p className="text-xs text-[#7A8CA0]">{link.desc}</p>
                    </div>
                    <ArrowRight className="shrink-0 text-[#7A8CA0] transition-transform group-hover:translate-x-0.5" size={14} style={{ color: lc.color }} />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Member card CTA banner */}
          <div className="mx-5 mb-5 overflow-hidden rounded-[12px] px-5 py-4 text-white" style={{ background: "linear-gradient(120deg, #0F5F6B 0%, #1A8A9B 60%, #25B4C8 100%)" }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[.6rem] font-bold uppercase tracking-[.14em] text-white/60 mb-1">Carte membre</p>
                <p className="text-sm font-bold leading-snug">Carte de membre CZI</p>
                <p className="text-[.75rem] text-white/70 mt-0.5">{cardRequestHint}</p>
              </div>
              <Link href={cardRequestLabel === "Compléter ma fiche membre" ? "/onboarding" : "/app/carte-membre"} className="shrink-0">
                <div className="flex items-center gap-1.5 rounded-[8px] bg-white/20 px-3 py-2 text-xs font-semibold text-white hover:bg-white/30 transition-colors">
                  <CreditCard size={13} />
                  {cardRequestLabel}
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Right: Activity card */}
        <div className="rounded-[14px] border border-[#E2E8F0] bg-white overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(18,32,46,.06)" }}>
          <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-4">
            <h3 className="text-sm font-bold text-[#12202E]">Activité récente</h3>
            <span className="text-xs text-[#1A8A9B] font-semibold">Voir tout</span>
          </div>
          <div className="p-5 space-y-4">
            {activityItems.map((item, i) => (
              <div key={item.label} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-2.5 w-2.5 rounded-full mt-1 flex-shrink-0" style={{ background: item.dot }} />
                  {i < activityItems.length - 1 ? (
                    <div className="flex-1 w-px mt-1" style={{ background: "#E2E8F0" }} />
                  ) : null}
                </div>
                <div className="pb-4">
                  <p className="text-sm font-semibold text-[#12202E]">{item.label}</p>
                  <p className="text-xs text-[#7A8CA0] mt-0.5">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
