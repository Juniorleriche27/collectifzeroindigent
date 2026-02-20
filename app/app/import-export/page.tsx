import Link from "next/link";
import { ArrowUpDown, FileDown, FileUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default function ImportExportPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          Import/Export
        </p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">Flux de donnees</h2>
      </div>

      <Card className="space-y-4">
        <div className="rounded-full bg-muted-surface p-4 text-muted w-fit">
          <ArrowUpDown size={28} />
        </div>
        <CardTitle>Importer ou exporter</CardTitle>
        <CardDescription>
          Point d&apos;entree pour les operations de migration de donnees.
        </CardDescription>
        <div className="flex flex-wrap gap-3">
          <Link href="/app/import">
            <Button>
              <FileUp className="mr-2" size={16} />
              Aller vers import
            </Button>
          </Link>
          <Link href="/app/export">
            <Button variant="secondary">
              <FileDown className="mr-2" size={16} />
              Aller vers export
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
