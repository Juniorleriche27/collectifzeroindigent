import { FileUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Import</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">Import de donnees</h2>
      </div>
      <Card className="space-y-4">
        <div className="rounded-full bg-muted-surface p-4 text-muted w-fit">
          <FileUp size={28} />
        </div>
        <CardTitle>Importer des membres</CardTitle>
        <CardDescription>
          MVP simple: importer un fichier CSV pour peupler les membres (validation a venir).
        </CardDescription>
        <Button variant="secondary">Choisir un fichier</Button>
      </Card>
    </div>
  );
}
