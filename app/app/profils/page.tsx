import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getCurrentMember } from "@/lib/backend/api";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getProfileRoleByAuthUser } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";

function roleLabel(role: string): string {
  switch (role) {
    case "admin":
      return "Administrateur";
    case "ca":
      return "Conseil administration";
    case "cn":
      return "Coordination nationale";
    case "pf":
      return "Point focal regional";
    default:
      return "Membre";
  }
}

function roleScope(role: string): string[] {
  switch (role) {
    case "admin":
      return ["Membres (global)", "Organisations", "Parametres", "Import/Export"];
    case "ca":
      return ["Dashboard gouvernance", "Membres (lecture globale)", "Support"];
    case "cn":
      return ["Membres (coordination)", "Communes/Regions", "Support"];
    case "pf":
      return ["Membres (perimetre regional)", "Onboarding", "Support"];
    default:
      return ["Membres (RLS personnel)", "Parametres", "Support"];
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
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        userEmail = user.email ?? userEmail;
        userId = user.id;
        const roleLookup = await getProfileRoleByAuthUser(supabase, user.id);
        if (roleLookup.error) {
          throw roleLookup.error;
        }
        if (roleLookup.role) {
          role = roleLookup.role;
        }
      }

      const member = await getCurrentMember();
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
    loadError = "Supabase non configure. Ajoutez les variables d'environnement.";
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
          <CardTitle className="text-base">Profil connecte</CardTitle>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-muted">Nom:</span> {firstName} {lastName}
            </p>
            <p>
              <span className="text-muted">Email:</span> {userEmail}
            </p>
            <p>
              <span className="text-muted">Telephone:</span> {phone}
            </p>
            <p>
              <span className="text-muted">ID auth:</span> {userId}
            </p>
            <p>
              <span className="text-muted">ID membre:</span> {memberId ?? "Non lie"}
            </p>
          </div>
        </Card>

        <Card className="space-y-3">
          <CardTitle className="text-base">Role et gouvernance</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="success">{roleLabel(role)}</Badge>
            <CardDescription>role DB: {role}</CardDescription>
          </div>
          <div className="space-y-2">
            <CardDescription>Perimetre acces actif:</CardDescription>
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
