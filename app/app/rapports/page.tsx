import Link from "next/link";
import { CalendarDays, Download, FileText, Link2, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { listProjects } from "@/lib/supabase/projects";
import { listReports, getReportDownloadUrl, type ActivityReportRecord } from "@/lib/supabase/reports";

import { createReportAction } from "./actions";
import { ReportUploadClient } from "./report-upload-client";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function paramValue(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

function fmt(date: string | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

async function ReportRow({ report, canManage }: { report: ActivityReportRecord; canManage: boolean }) {
  let downloadUrl: string | null = null;
  if (report.file_url && !report.file_url.startsWith("http")) {
    downloadUrl = await getReportDownloadUrl(report.file_url);
  } else if (report.file_url?.startsWith("http")) {
    downloadUrl = report.file_url;
  }

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-surface-elevated px-5 py-4 shadow-xs transition-all duration-150 hover:border-primary/20 hover:shadow-sm md:flex-row">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
        <FileText size={22} />
      </div>

      <div className="flex-1 space-y-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold leading-snug text-foreground">{report.title}</p>
          {!report.is_published ? <Badge variant="warning">Brouillon</Badge> : null}
          {report.is_public ? <Badge variant="primary">Public</Badge> : null}
        </div>
        {report.description ? (
          <p className="line-clamp-2 text-sm text-muted">{report.description}</p>
        ) : null}
        <div className="flex flex-wrap gap-3 text-xs text-muted">
          {report.project_title ? (
            <span className="flex items-center gap-1.5">
              <Link2 size={11} />
              {report.project_title}
            </span>
          ) : null}
          <span className="flex items-center gap-1.5">
            <CalendarDays size={11} />
            {fmt(report.published_at ?? report.created_at)}
          </span>
          {report.file_name ? (
            <span className="rounded bg-muted-surface px-1.5 py-0.5 font-mono">{report.file_name}</span>
          ) : null}
          {report.file_size_bytes ? <span>{formatBytes(report.file_size_bytes)}</span> : null}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        {downloadUrl ? (
          <a download href={downloadUrl} rel="noopener noreferrer" target="_blank">
            <Button className="gap-1.5" size="sm" variant="primary">
              <Download size={13} />
              Télécharger
            </Button>
          </a>
        ) : null}
        {canManage ? (
          <Link href={`/app/rapports/${report.id}/edit`}>
            <Button size="sm" variant="ghost">Modifier</Button>
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export default async function RapportsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const errorMessage = paramValue(params.error).trim();
  const noticeMessage = paramValue(params.notice).trim();
  const showForm = paramValue(params.new) === "1";

  let loadError: string | null = null;
  let overview: Awaited<ReturnType<typeof listReports>> | null = null;
  let projectOptions: Array<{ id: string; title: string }> = [];

  try {
    [overview] = await Promise.all([
      listReports(),
    ]);
    if (overview?.canManage) {
      const projectsData = await listProjects();
      projectOptions = projectsData.items.map((p) => ({ id: p.id, title: p.title }));
    }
  } catch (err) {
    console.error("Unable to load reports", err);
    loadError = err instanceof Error ? err.message : "Impossible de charger les rapports.";
  }

  const canManage = overview?.canManage ?? false;
  const items = overview?.items ?? [];

  const publishedItems = items.filter((r) => r.is_published);
  const draftItems = items.filter((r) => !r.is_published);

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-[#0a8ea8] px-6 py-5 text-white shadow-md">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">Contenus</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">Rapports d&apos;activité</h2>
            <p className="mt-1 text-sm text-white/75">
              Téléchargez les rapports du Collectif Zéro Indigent.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold">
              {publishedItems.length} publié{publishedItems.length !== 1 ? "s" : ""}
            </span>
            {canManage ? (
              <Link href="/app/rapports?new=1">
                <Button variant="secondary" size="sm" className="gap-1.5">
                  <Plus size={14} />
                  Nouveau rapport
                </Button>
              </Link>
            ) : null}
          </div>
        </div>
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <FileText className="pointer-events-none absolute right-6 bottom-4 text-white/15" size={72} />
      </div>

      {loadError ? (
        <Card className="border-red-200 bg-red-50">
          <CardDescription className="text-red-700">{loadError}</CardDescription>
        </Card>
      ) : null}
      {errorMessage ? (
        <Card className="border-red-200 bg-red-50">
          <CardDescription className="text-red-700">{errorMessage}</CardDescription>
        </Card>
      ) : null}
      {noticeMessage ? (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardDescription className="text-emerald-700">{noticeMessage}</CardDescription>
        </Card>
      ) : null}

      {/* Create form */}
      {canManage && showForm ? (
        <Card className="space-y-4">
          <CardTitle>Ajouter un rapport d&apos;activité</CardTitle>
          <form action={createReportAction} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="report-title">
                  Titre <span className="text-red-500">*</span>
                </label>
                <Input id="report-title" name="title" placeholder="Ex: Rapport annuel 2025" required />
              </div>
              {projectOptions.length > 0 ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="report-project">
                    Projet associé (optionnel)
                  </label>
                  <select
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
                    id="report-project"
                    name="project_id"
                  >
                    <option value="">— Aucun projet —</option>
                    {projectOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="report-description">
                Description
              </label>
              <textarea
                className="min-h-[80px] w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/20"
                id="report-description"
                name="description"
                placeholder="Résumé du rapport, période couverte…"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fichier PDF / Word</label>
              <ReportUploadClient />
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center gap-2 text-sm font-medium">
                <input name="is_published" type="checkbox" />
                Publier (visible aux membres)
              </label>
              <label className="inline-flex items-center gap-2 text-sm font-medium">
                <input name="is_public" type="checkbox" />
                Public (accessible aux partenaires sans connexion)
              </label>
            </div>

            <div className="flex gap-3">
              <Button type="submit">Enregistrer le rapport</Button>
              <Link href="/app/rapports">
                <Button type="button" variant="secondary">
                  Annuler
                </Button>
              </Link>
            </div>
          </form>
        </Card>
      ) : null}

      {/* Published reports */}
      {publishedItems.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-muted">Rapports publiés</h3>
          <div className="space-y-3">
            {publishedItems.map((report) => (
              <ReportRow canManage={canManage} key={report.id} report={report} />
            ))}
          </div>
        </section>
      ) : !loadError ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted-surface/30 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
            <FileText className="text-emerald-600" size={32} />
          </div>
          <h3 className="mt-4 text-base font-semibold">Aucun rapport disponible</h3>
          <p className="mt-1 max-w-sm text-sm text-muted">
            {canManage
              ? "Publiez le premier rapport d'activité en cliquant sur « Nouveau rapport »."
              : "Les rapports d'activité seront disponibles ici après leur publication."}
          </p>
          {canManage ? (
            <Link href="/app/rapports?new=1" className="mt-5">
              <Button className="gap-2"><Plus size={15} />Nouveau rapport</Button>
            </Link>
          ) : null}
        </div>
      ) : null}

      {/* Drafts (managers only) */}
      {canManage && draftItems.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-muted">Brouillons</h3>
          <div className="space-y-3">
            {draftItems.map((report) => (
              <ReportRow canManage={canManage} key={report.id} report={report} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
