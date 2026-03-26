import Link from "next/link";
import { CalendarDays, FolderOpen, MapPin, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { listProjects, type ProjectRecord } from "@/lib/supabase/projects";

import { createProjectAction } from "./actions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function paramValue(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

const STATUS_LABELS: Record<string, string> = {
  active: "En cours",
  cancelled: "Annulé",
  completed: "Terminé",
  upcoming: "À venir",
};

const STATUS_VARIANTS: Record<string, "default" | "success" | "warning" | "danger"> = {
  active: "success",
  cancelled: "danger",
  completed: "default",
  upcoming: "warning",
};

function formatDateRange(start: string | null, end: string | null): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  if (start && end) return `${fmt(start)} → ${fmt(end)}`;
  if (start) return `Début : ${fmt(start)}`;
  if (end) return `Fin : ${fmt(end)}`;
  return "Dates non précisées";
}

function ProjectCard({ project }: { project: ProjectRecord }) {
  return (
    <Link href={`/app/projets/${project.id}`}>
      <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md">
        {project.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={project.title}
            className="h-44 w-full object-cover"
            src={project.cover_image_url}
          />
        ) : (
          <div className="flex h-44 items-center justify-center bg-gradient-to-br from-primary/10 to-indigo-500/10">
            <FolderOpen className="text-primary/40" size={40} />
          </div>
        )}

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-start gap-2">
            <h3 className="flex-1 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
              {project.title}
            </h3>
            <Badge variant={STATUS_VARIANTS[project.status] ?? "default"}>
              {STATUS_LABELS[project.status] ?? project.status}
            </Badge>
          </div>

          {project.short_description ? (
            <p className="line-clamp-2 text-xs text-muted">{project.short_description}</p>
          ) : null}

          <div className="mt-auto flex flex-wrap gap-3 text-xs text-muted">
            <span className="flex items-center gap-1">
              <CalendarDays size={12} />
              {formatDateRange(project.start_date, project.end_date)}
            </span>
            {project.location ? (
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {project.location}
              </span>
            ) : null}
            {!project.is_published ? <Badge variant="warning">Brouillon</Badge> : null}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default async function ProjetsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const errorMessage = paramValue(params.error).trim();
  const noticeMessage = paramValue(params.notice).trim();
  const showForm = paramValue(params.new) === "1";

  let loadError: string | null = null;
  let overview: Awaited<ReturnType<typeof listProjects>> | null = null;

  try {
    overview = await listProjects();
  } catch (err) {
    console.error("Unable to load projects", err);
    loadError = err instanceof Error ? err.message : "Impossible de charger les projets.";
  }

  const canManage = overview?.canManage ?? false;
  const items = overview?.items ?? [];

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div
        className="relative overflow-hidden rounded-2xl px-8 py-7 text-white shadow-md"
        style={{ background: "linear-gradient(120deg, #0F5F6B 0%, #1A8A9B 60%, #25B4C8 100%)" }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "repeating-linear-gradient(45deg, rgba(255,255,255,.03) 0, rgba(255,255,255,.03) 1px, transparent 0, transparent 24px)",
          }}
        />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[.65rem] font-bold uppercase tracking-[.14em] text-white/60 mb-[6px]">Contenus</p>
            <h1 className="text-[1.6rem] font-bold leading-[1.15] text-white mb-[6px]" style={{ fontFamily: "'Syne', sans-serif" }}>
              Projets CZI
            </h1>
            <p className="text-[.85rem] text-white/65">
              Projets en cours, à venir et réalisés du Collectif Zéro Indigent.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold">
              {items.length} projet{items.length !== 1 ? "s" : ""}
            </span>
            {canManage ? (
              <Link href="/app/projets?new=1">
                <Button variant="secondary" size="sm" className="gap-1.5">
                  <Plus size={14} />
                  Nouveau projet
                </Button>
              </Link>
            ) : null}
          </div>
        </div>
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
          <CardTitle>Créer un projet</CardTitle>
          <form action={createProjectAction} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="title">
                  Titre <span className="text-red-500">*</span>
                </label>
                <Input id="title" name="title" placeholder="Nom du projet" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="status">
                  Statut
                </label>
                <Select defaultValue="upcoming" id="status" name="status">
                  <option value="upcoming">À venir</option>
                  <option value="active">En cours</option>
                  <option value="completed">Terminé</option>
                  <option value="cancelled">Annulé</option>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="short_description">
                Description courte
              </label>
              <Input id="short_description" name="short_description" placeholder="Résumé en une ligne" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="description">
                Description complète
              </label>
              <textarea
                className="min-h-[100px] w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/20"
                id="description"
                name="description"
                placeholder="Détails, objectifs, bénéficiaires…"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="start_date">
                  Date de début
                </label>
                <Input id="start_date" name="start_date" type="date" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="end_date">
                  Date de fin
                </label>
                <Input id="end_date" name="end_date" type="date" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="location">
                  Localisation
                </label>
                <Input id="location" name="location" placeholder="Ville, région…" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="cover_image_url">
                URL de l&apos;image de couverture
              </label>
              <Input id="cover_image_url" name="cover_image_url" placeholder="https://…" type="url" />
            </div>

            <label className="inline-flex items-center gap-2 text-sm font-medium">
              <input name="is_published" type="checkbox" />
              Publier immédiatement (visible aux membres)
            </label>

            <div className="flex gap-3">
              <Button type="submit">Créer le projet</Button>
              <Link href="/app/projets">
                <Button type="button" variant="secondary">
                  Annuler
                </Button>
              </Link>
            </div>
          </form>
        </Card>
      ) : null}

      {/* Projects grid */}
      {items.length === 0 && !loadError ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted-surface/30 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <FolderOpen className="text-primary" size={32} />
          </div>
          <h3 className="mt-4 text-base font-semibold">Aucun projet pour le moment</h3>
          <p className="mt-1 max-w-sm text-sm text-muted">
            {canManage
              ? "Créez le premier projet CZI en cliquant sur « Nouveau projet »."
              : "Les projets seront affichés ici dès leur publication."}
          </p>
          {canManage ? (
            <Link href="/app/projets?new=1" className="mt-5">
              <Button className="gap-2"><Plus size={15} />Nouveau projet</Button>
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
