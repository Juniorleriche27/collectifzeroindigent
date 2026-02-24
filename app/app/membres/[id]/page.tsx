import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getLocations, getMemberById, listOrganisations } from "@/lib/backend/api";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getProfileRoleByAuthUser } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";

import { MemberEditForm } from "./member-edit-form";
import { MemberRoleForm } from "./member-role-form";
import { MemberValidationForm } from "./member-validation-form";

function statusVariant(status: string | null): "success" | "warning" | "danger" | "default" {
  if (status === "active") return "success";
  if (status === "pending") return "warning";
  if (status === "rejected") return "danger";
  if (status === "suspended") return "danger";
  return "default";
}

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isSupabaseConfigured) {
    return (
      <div className="space-y-6">
        <Card>
          <CardTitle>Supabase non configure</CardTitle>
          <CardDescription className="mt-2">
            Ajoutez les variables d&apos;environnement pour charger le detail membre.
          </CardDescription>
        </Card>
      </div>
    );
  }

  let member: Awaited<ReturnType<typeof getMemberById>> | null = null;
  let locations: Awaited<ReturnType<typeof getLocations>> | null = null;
  let organisations = [] as Awaited<ReturnType<typeof listOrganisations>>["items"];
  let currentRole = "member";
  let targetRole: string | null = null;
  let loadError: string | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const roleLookup = await getProfileRoleByAuthUser(supabase, user.id);
      if (!roleLookup.error && roleLookup.role) {
        currentRole = roleLookup.role.trim().toLowerCase();
      }
    }

    const [memberData, locationData, organisationData] = await Promise.all([
      getMemberById(id),
      getLocations(),
      listOrganisations(),
    ]);
    member = memberData;
    locations = locationData;
    organisations = organisationData.items;

    if (memberData?.user_id) {
      const targetRoleLookup = await getProfileRoleByAuthUser(supabase, memberData.user_id);
      if (!targetRoleLookup.error && targetRoleLookup.role) {
        targetRole = targetRoleLookup.role.trim().toLowerCase();
      }
    }
  } catch (error) {
    console.error("Unable to load member detail", error);
    loadError = "Impossible de charger ce membre pour le moment.";
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardTitle>Erreur de chargement</CardTitle>
          <CardDescription className="mt-2">{loadError}</CardDescription>
        </Card>
      </div>
    );
  }

  if (!member || !locations) {
    return (
      <div className="space-y-6">
        <Card>
          <CardTitle>Membre introuvable</CardTitle>
          <CardDescription className="mt-2">
            Ce membre n&apos;existe pas ou n&apos;est pas visible avec votre role actuel.
          </CardDescription>
          <Link className="mt-4 inline-block text-sm font-semibold text-primary" href="/app/membres">
            Retour a la liste membres
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Fiche membre</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">{member.id}</h2>
          <CardDescription className="mt-1">
            {member.first_name} {member.last_name}
          </CardDescription>
        </div>
        <Badge variant={statusVariant(member.status)}>{member.status ?? "unknown"}</Badge>
      </div>

      {currentRole === "member" ? (
        <>
          <Card className="space-y-2">
            <CardTitle>Mode lecture</CardTitle>
            <CardDescription>
              Ce profil est visible pour contact reseau. Les modifications sont reservees aux roles
              gouvernance.
            </CardDescription>
          </Card>
          <Card className="space-y-3">
            <CardTitle>Contacter ce membre</CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              {member.phone ? (
                <a
                  className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted-surface"
                  href={`tel:${member.phone.replace(/\s+/g, "")}`}
                >
                  Appeler
                </a>
              ) : null}
              {member.email ? (
                <a
                  className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted-surface"
                  href={`mailto:${member.email}`}
                >
                  Envoyer un email
                </a>
              ) : null}
              {!member.phone && !member.email ? (
                <CardDescription>Aucun contact disponible pour ce membre.</CardDescription>
              ) : null}
            </div>
          </Card>
        </>
      ) : (
        <>
          <Card className="space-y-2">
            <CardTitle>Edition membre</CardTitle>
            <CardDescription>
              Les modifications sont soumises a RLS. Un compte standard ne peut editer que ses
              propres donnees.
            </CardDescription>
          </Card>

          <Card className="space-y-2">
            <CardTitle>Validation membre</CardTitle>
            <CardDescription>
              Workflow backoffice officiel: transition `pending` vers `active` ou `rejected`,
              avec motif et ajustement de cellule.
            </CardDescription>
            {currentRole === "admin" || currentRole === "ca" || currentRole === "cn" || currentRole === "pf" ? (
              member.status === "pending" ? (
                <MemberValidationForm member={member} />
              ) : (
                <CardDescription>
                  Ce membre n&apos;est plus en attente. Decision enregistree: {member.status ?? "unknown"}.
                </CardDescription>
              )
            ) : (
              <CardDescription>
                Ce role ne peut pas executer la validation membre.
              </CardDescription>
            )}
          </Card>

          <Card>
            <MemberEditForm
              communes={locations.communes}
              member={member}
              organisations={organisations}
              prefectures={locations.prefectures}
              regions={locations.regions}
            />
          </Card>

          <Card className="space-y-2">
            <CardTitle>Role gouvernance</CardTitle>
            <CardDescription>
              Admin et CA peuvent ajuster le role applicatif de ce compte dans `public.profile`.
            </CardDescription>
            <MemberRoleForm
              actorRole={currentRole}
              currentRole={targetRole}
              memberId={member.id}
              targetUserId={member.user_id}
            />
          </Card>
        </>
      )}
    </div>
  );
}
