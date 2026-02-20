import { CircleUserRound } from "lucide-react";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default function ProfilsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Profils</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">Gestion des profils</h2>
      </div>
      <Card className="flex min-h-[320px] flex-col items-center justify-center text-center">
        <div className="rounded-full bg-muted-surface p-4 text-muted">
          <CircleUserRound size={36} />
        </div>
        <CardTitle className="mt-6">En cours de developpement</CardTitle>
        <CardDescription className="mt-3 max-w-md">
          Cette section sera reliee aux profils utilisateurs et aux droits de gouvernance.
        </CardDescription>
      </Card>
    </div>
  );
}
