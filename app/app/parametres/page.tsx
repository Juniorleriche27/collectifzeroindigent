import { Card, CardDescription } from "@/components/ui/card";
import { getCurrentMember } from "@/lib/backend/api";
import { isSupabaseConfigured } from "@/lib/supabase/config";

import { ParametresClient } from "./parametres-client";

export default async function ParametresPage() {
  const defaults = {
    email: "admin@czi.fr",
    firstName: "Admin",
    lastName: "User",
    phone: "",
  };
  let loadError: string | null = null;

  if (isSupabaseConfigured) {
    try {
      const member = await getCurrentMember();
      if (member) {
        defaults.firstName = member.first_name ?? defaults.firstName;
        defaults.lastName = member.last_name ?? defaults.lastName;
        defaults.phone = member.phone ?? defaults.phone;
        defaults.email = member.email ?? defaults.email;
      }
    } catch {
      loadError = "Impossible de charger les informations du compte.";
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Parametres</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">Compte et configuration</h2>
      </div>

      {!isSupabaseConfigured ? (
        <Card>
          <CardDescription>
            Supabase non configure: formulaire actif avec donnees de demonstration.
          </CardDescription>
        </Card>
      ) : null}

      {loadError ? (
        <Card>
          <CardDescription className="text-red-600">{loadError}</CardDescription>
        </Card>
      ) : null}

      <ParametresClient defaults={defaults} />
    </div>
  );
}
