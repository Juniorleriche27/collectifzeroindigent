import { Card, CardDescription } from "@/components/ui/card";
import { getCurrentMember } from "@/lib/backend/api";
import { getCurrentUser } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getCurrentProfileRole } from "@/lib/supabase/profile-server";

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
      const [memberResult, userResult, roleResult] = await Promise.allSettled([
        getCurrentMember(),
        getCurrentUser(),
        getCurrentProfileRole(),
      ]);
      const member = memberResult.status === "fulfilled" ? memberResult.value : null;
      const user = userResult.status === "fulfilled" ? userResult.value : null;
      const currentProfileRole = roleResult.status === "fulfilled" ? roleResult.value : null;
      if (memberResult.status === "rejected") {
        console.error("Unable to load current member for settings page", memberResult.reason);
        loadError = "Impossible de charger les informations du compte.";
      }
      if (userResult.status === "rejected") {
        console.error("Unable to load current user metadata for settings page", userResult.reason);
      }
      if (roleResult.status === "rejected") {
        console.error("Unable to load current rôle for settings page", roleResult.reason);
      }
      if (member) {
        defaults.firstName = member.first_name ?? defaults.firstName;
        defaults.lastName = member.last_name ?? defaults.lastName;
        defaults.phone = member.phone ?? defaults.phone;
        defaults.email = member.email ?? defaults.email;
      }

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
      }
      if (currentProfileRole) {
        defaults.role = currentProfileRole;
      }
    } catch (error) {
      console.error("Unable to load settings page data", error);
      loadError = "Impossible de charger les informations du compte.";
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Paramètres</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">Compte et configuration</h2>
      </div>

      {!isSupabaseConfigured ? (
        <Card>
          <CardDescription>
            Supabase non configuré : formulaire actif avec données de demonstration.
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
