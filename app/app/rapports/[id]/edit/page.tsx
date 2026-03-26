import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { listProjects } from "@/lib/supabase/projects";
import { listReports } from "@/lib/supabase/reports";

import { updateReportAction } from "../../actions";
import { ReportUploadClient } from "../../report-upload-client";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function paramValue(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function EditReportPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const errorMessage = paramValue(sp.error).trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: report, error } = await supabase
    .from("activity_report")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !report) notFound();

  // Check permissions
  const { canManage } = await listReports();
  if (!canManage) redirect("/app/rapports");

  const { items: projects } = await listProjects();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/rapports">
          <Button className="gap-2" size="sm" variant="ghost">
            <ArrowLeft size={15} />
            Rapports
          </Button>
        </Link>
      </div>

      {errorMessage ? (
        <Card>
          <CardDescription className="text-red-600">{errorMessage}</CardDescription>
        </Card>
      ) : null}

      <Card className="space-y-4">
        <CardTitle>Modifier le rapport</CardTitle>
        <form action={updateReportAction} className="grid gap-4">
          <input name="report_id" type="hidden" value={report.id} />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="title">
                Titre <span className="text-red-500">*</span>
              </label>
              <Input defaultValue={report.title} id="title" name="title" required />
            </div>
            {projects.length > 0 ? (
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="project_id">
                  Projet associé
                </label>
                <select
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
                  defaultValue={report.project_id ?? ""}
                  id="project_id"
                  name="project_id"
                >
                  <option value="">— Aucun projet —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="description">
              Description
            </label>
            <textarea
              className="min-h-[80px] w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/20"
              defaultValue={report.description ?? ""}
              id="description"
              name="description"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Fichier PDF / Word</label>
            <ReportUploadClient
              currentFileName={report.file_name}
              currentFileUrl={report.file_url}
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2 text-sm font-medium">
              <input defaultChecked={report.is_published} name="is_published" type="checkbox" />
              Publié (visible aux membres)
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-medium">
              <input defaultChecked={report.is_public} name="is_public" type="checkbox" />
              Public (partenaires sans connexion)
            </label>
            {!report.published_at ? (
              <label className="inline-flex items-center gap-2 text-sm font-medium">
                <input name="set_published_at" type="checkbox" />
                Définir la date de publication maintenant
              </label>
            ) : null}
          </div>

          <div className="flex gap-3">
            <Button type="submit">Enregistrer</Button>
            <Link href="/app/rapports">
              <Button type="button" variant="secondary">
                Annuler
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
