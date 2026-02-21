import { Card, CardDescription } from "@/components/ui/card";
import { getCurrentMember } from "@/lib/backend/api";
import { getProfileRoleByAuthUser } from "@/lib/supabase/profile";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

import { ParametresClient } from "./parametres-client";

export default async function ParametresPage() {
  const defaults = {
    email: "admin@czi.fr",
    firstName: "Admin",
    lastName: "User",
    notifications: {
      emailUpdates: true,
      securityAlerts: true,
    },
    phone: "",
    role: "member",
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

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const metadata = user.user_metadata as Record<string, unknown> | null;
        const notificationData = metadata?.czi_notifications;
        if (notificationData && typeof notificationData === "object") {
          const notificationObject = notificationData as Record<string, unknown>;
          if (typeof notificationObject.email_updates === "boolean") {
            defaults.notifications.emailUpdates = notificationObject.email_updates;
          }
          if (typeof notificationObject.security_alerts === "boolean") {
            defaults.notifications.securityAlerts = notificationObject.security_alerts;
          }
        }

        const roleLookup = await getProfileRoleByAuthUser(supabase, user.id);
        if (roleLookup.error) {
          console.error("Unable to load profile role", roleLookup.error);
        } else if (roleLookup.role) {
          defaults.role = roleLookup.role;
        }
      }
    } catch (error) {
      console.error("Unable to load auth metadata for settings", error);
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
