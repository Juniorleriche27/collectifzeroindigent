import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getProjectById } from "@/lib/supabase/projects";

import { updateProjectAction } from "../actions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type Params = Promise<{ id: string }>;

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

function fmt(date: string | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default async function ProjetDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const errorMessage = paramValue(sp.error).trim();
  const noticeMessage = paramValue(sp.notice).trim();
  const editing = paramValue(sp.edit) === "1";

  const { canManage, item } = await getProjectById(id);

  if (!item) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/app/projets">
          <Button className="gap-2" size="sm" variant="ghost">
            <ArrowLeft size={15} />
            Projets
          </Button>
        </Link>
      </div>

      {errorMessage ? (
        <Card>
          <CardDescription className="text-red-600">{errorMessage}</CardDescription>
        </Card>
      ) : null}
      {noticeMessage ? (
        <Card>
          <CardDescription className="text-emerald-700">{noticeMessage}</CardDescription>
        </Card>
      ) : null}

      {/* Edit form */}
      {canManage && editing ? (
        <Card className="space-y-4">
          <CardTitle>Modifier le projet</CardTitle>
          <form action={updateProjectAction} className="grid gap-4">
            <input name="project_id" type="hidden" value={item.id} />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="title">
                  Titre <span className="text-red-500">*</span>
                </label>
                <Input defaultValue={item.title} id="title" name="title" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="status">
                  Statut
                </label>
                <Select defaultValue={item.status} id="status" name="status">
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
              <Input
                defaultValue={item.short_description ?? ""}
                id="short_description"
                name="short_description"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="description">
                Description complète
              </label>
              <textarea
                className="min-h-[120px] w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/20"
                defaultValue={item.description ?? ""}
                id="description"
                name="description"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="start_date">
                  Date de début
                </label>
                <Input defaultValue={item.start_date ?? ""} id="start_date" name="start_date" type="date" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="end_date">
                  Date de fin
                </label>
                <Input defaultValue={item.end_date ?? ""} id="end_date" name="end_date" type="date" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="location">
                  Localisation
                </label>
                <Input defaultValue={item.location ?? ""} id="location" name="location" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="cover_image_url">
                URL image de couverture
              </label>
              <Input
                defaultValue={item.cover_image_url ?? ""}
                id="cover_image_url"
                name="cover_image_url"
                type="url"
              />
            </div>

            <label className="inline-flex items-center gap-2 text-sm font-medium">
              <input defaultChecked={item.is_published} name="is_published" type="checkbox" />
              Publié (visible aux membres)
            </label>

            <div className="flex gap-3">
              <Button type="submit">Enregistrer</Button>
              <Link href={`/app/projets/${item.id}`}>
                <Button type="button" variant="secondary">
                  Annuler
                </Button>
              </Link>
            </div>
          </form>
        </Card>
      ) : (
        <div className="space-y-5">
          {item.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={item.title}
              className="h-56 w-full rounded-2xl object-cover shadow"
              src={item.cover_image_url}
            />
          ) : null}

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold tracking-tight">{item.title}</h2>
                <Badge variant={STATUS_VARIANTS[item.status] ?? "default"}>
                  {STATUS_LABELS[item.status] ?? item.status}
                </Badge>
                {!item.is_published ? <Badge variant="warning">Brouillon</Badge> : null}
              </div>
              {item.short_description ? (
                <p className="mt-2 text-muted">{item.short_description}</p>
              ) : null}
            </div>
            {canManage ? (
              <Link href={`/app/projets/${item.id}?edit=1`}>
                <Button className="gap-2" size="sm" variant="secondary">
                  <Pencil size={14} />
                  Modifier
                </Button>
              </Link>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <CalendarDays size={15} />
              {item.start_date || item.end_date
                ? `${fmt(item.start_date)} → ${fmt(item.end_date)}`
                : "Dates non précisées"}
            </span>
            {item.location ? (
              <span className="flex items-center gap-1.5">
                <MapPin size={15} />
                {item.location}
              </span>
            ) : null}
          </div>

          {item.description ? (
            <Card>
              <CardTitle className="text-base">Description</CardTitle>
              <div className="mt-3 whitespace-pre-wrap text-sm text-foreground/85">{item.description}</div>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}
