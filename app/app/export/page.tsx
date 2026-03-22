import { Download, FileDown, FileJson2, FileSpreadsheet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

function ExportButtons({ action }: { action: string }) {
  return (
    <div className="flex flex-wrap gap-3">
      <form action={action} method="get">
        <input name="format" type="hidden" value="csv" />
        <Button type="submit">
          <Download size={16} />
          Exporter CSV
        </Button>
      </form>
      <form action={action} method="get">
        <input name="format" type="hidden" value="json" />
        <Button type="submit" variant="secondary">
          <FileJson2 size={16} />
          Exporter JSON
        </Button>
      </form>
      <form action={action} method="get">
        <input name="format" type="hidden" value="xlsx" />
        <Button type="submit" variant="secondary">
          <FileSpreadsheet size={16} />
          Exporter Excel
        </Button>
      </form>
    </div>
  );
}

export default function ExportPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Export</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">Export de donnees</h2>
      </div>

      <Card className="space-y-4">
        <div className="w-fit rounded-full bg-muted-surface p-4 text-muted">
          <FileDown size={28} />
        </div>
        <CardTitle>Exporter les membres</CardTitle>
        <CardDescription>
          Export CSV, Excel ou JSON des membres visibles selon vos droits RLS.
        </CardDescription>
        <ExportButtons action="/api/exports/members" />
      </Card>

      <Card className="space-y-4">
        <div className="w-fit rounded-full bg-muted-surface p-4 text-muted">
          <FileDown size={28} />
        </div>
        <CardTitle>Exporter les fiches onboarding</CardTitle>
        <CardDescription>
          Feuille complete d&apos;onboarding avec localisation, profil CZI, besoins,
          consentements,
          situation socio-economique et score d&apos;indigence calcule.
        </CardDescription>
        <ExportButtons action="/api/exports/onboarding" />
      </Card>

      <Card className="space-y-4">
        <div className="w-fit rounded-full bg-muted-surface p-4 text-muted">
          <FileDown size={28} />
        </div>
        <CardTitle>Contenu de la fiche onboarding</CardTitle>
        <CardDescription>
          L&apos;export onboarding inclut les identifiants territoriaux, les textes libres, les
          champs
          multi-choix, les consentements et les colonnes socio-economiques pretes a etre
          reimportees.
        </CardDescription>
      </Card>
    </div>
  );
}
