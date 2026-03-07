import { Download, FileDown, FileJson2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default function ExportPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Export</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">Export de donnees</h2>
      </div>
      <Card className="space-y-4">
        <div className="rounded-full bg-muted-surface p-4 text-muted w-fit">
          <FileDown size={28} />
        </div>
        <CardTitle>Exporter les membres</CardTitle>
        <CardDescription>
          MVP simple: export CSV des membres visibles selon vos droits RLS.
        </CardDescription>
        <div className="flex flex-wrap gap-3">
          <form action="/api/exports/members" method="get">
            <input name="format" type="hidden" value="csv" />
            <Button type="submit">
              <Download size={16} />
              Exporter CSV
            </Button>
          </form>
          <form action="/api/exports/members" method="get">
            <input name="format" type="hidden" value="json" />
            <Button type="submit" variant="secondary">
              <FileJson2 size={16} />
              Exporter JSON
            </Button>
          </form>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="rounded-full bg-muted-surface p-4 text-muted w-fit">
          <FileDown size={28} />
        </div>
        <CardTitle>Contenu exporte</CardTitle>
        <CardDescription>
          L&apos;export reprend les membres visibles selon vos droits, avec identite, contact,
          localisation, mode d&apos;inscription, organisation et statut photo.
        </CardDescription>
      </Card>
    </div>
  );
}
