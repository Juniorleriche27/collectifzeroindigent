import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getCurrentMember } from "@/lib/backend/api";
import { getCurrentUser } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getCurrentProfileRole } from "@/lib/supabase/profile-server";

function roleLabel(role: string): string {
  switch (role) {
    case "admin":
      return "Administrateur";
    case "ca":
      return "Conseil d'administration";
    case "cn":
      return "Coordination nationale";
    case "pf":
      return "Point focal régional";
    default:
      return "Membre";
  }
}

function roleScope(role: string): string[] {
  switch (role) {
    case "admin":
      return ["Membres (global)", "Partenariat", "À propos", "Paramètres", "Import/Export"];
    case "ca":
      return ["Tableau de bord gouvernance", "Membres (lecture globale)", "Partenariat", "Assistance"];
    case "cn":
      return ["Membres (coordination)", "Partenariat", "Communes/Régions", "Assistance"];
    case "pf":
      return ["Membres (périmètre régional)", "Partenariat", "Fiche membre", "Assistance"];
    default:
      return ["Membres (RLS personnel)", "Partenariat", "À propos", "Paramètres", "Assistance"];
  }
}

export default async function ProfilsPage() {
  let loadError: string | null = null;
  let userEmail = "admin@czi.fr";
  let userId = "-";
  let firstName = "Admin";
  let lastName = "User";
  let phone = "-";
  let role = "member";
  let memberId: string | null = null;

  if (isSupabaseConfigured) {
    try {
      const [userResult, memberResult, roleResult] = await Promise.allSettled([
        getCurrentUser(),
        getCurrentMember(),
        getCurrentProfileRole(),
      ]);

      const user = userResult.status === "fulfilled" ? userResult.value : null;
      const member = memberResult.status === "fulfilled" ? memberResult.value : null;
      const currentProfileRole = roleResult.status === "fulfilled" ? roleResult.value : null;
      if (userResult.status === "rejected") {
        console.error("Unable to load current user for profils page", userResult.reason);
        loadError = "Impossible de charger toutes les informations profils.";
      }
      if (memberResult.status === "rejected") {
        console.error("Unable to load current member for profils page", memberResult.reason);
        loadError = "Impossible de charger toutes les informations profils.";
      }
      if (roleResult.status === "rejected") {
        console.error("Unable to load current rôle for profils page", roleResult.reason);
      }

      if (user) {
        userEmail = user.email ?? userEmail;
        userId = user.id;
      }
      if (currentProfileRole) {
        role = currentProfileRole;
      }
      if (member) {
        firstName = member.first_name ?? firstName;
        lastName = member.last_name ?? lastName;
        phone = member.phone ?? phone;
        memberId = member.id;
      }
    } catch (error) {
      console.error("Unable to load profils page data", error);
      loadError = "Impossible de charger les informations profils.";
    }
  } else {
    loadError = "Supabase non configuré. Ajoutez les variables d'environnement.";
  }

  const scope = roleScope(role);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Profils</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">Gestion des profils</h2>
      </div>

      {loadError ? (
        <Card>
          <CardDescription className="text-red-600">{loadError}</CardDescription>
        </Card>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <CardTitle className="text-base">Profil connecté</CardTitle>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-muted">Nom:</span> {firstName} {lastName}
            </p>
            <p>
              <span className="text-muted">Email:</span> {userEmail}
            </p>
            <p>
              <span className="text-muted">Téléphone:</span> {phone}
            </p>
            <p>
              <span className="text-muted">ID auth:</span> {userId}
            </p>
            <p>
              <span className="text-muted">ID membre:</span> {memberId ?? "Non lié"}
            </p>
          </div>
        </Card>

        <Card className="space-y-3">
          <CardTitle className="text-base">Rôle et gouvernance</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="success">{roleLabel(role)}</Badge>
            <CardDescription>Rôle DB : {role}</CardDescription>
          </div>
          <div className="space-y-2">
            <CardDescription>Périmètre d’accès actif :</CardDescription>
            {scope.map((item) => (
              <div key={item} className="rounded-lg border border-border px-3 py-2 text-sm">
                {item}
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
