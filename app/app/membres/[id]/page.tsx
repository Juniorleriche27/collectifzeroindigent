import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getLocations, getMemberById, listOrganisations } from "@/lib/backend/api";
import { isSupabaseConfigured } from "@/lib/supabase/config";

import { MemberEditForm } from "./member-edit-form";

function statusVariant(status: string | null): "success" | "warning" | "danger" | "default" {
  if (status === "active") return "success";
  if (status === "pending") return "warning";
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
  let loadError: string | null = null;

  try {
    const [memberData, locationData, organisationData] = await Promise.all([
      getMemberById(id),
      getLocations(),
      listOrganisations(),
    ]);
    member = memberData;
    locations = locationData;
    organisations = organisationData.items;
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

      <Card className="space-y-2">
        <CardTitle>Edition membre</CardTitle>
        <CardDescription>
          Les modifications sont soumises a RLS. Un compte standard ne peut editer que ses propres
          donnees.
        </CardDescription>
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
    </div>
  );
}
