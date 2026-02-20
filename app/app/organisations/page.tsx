import { Card, CardDescription } from "@/components/ui/card";
import { listOrganisations } from "@/lib/backend/api";
import { isSupabaseConfigured } from "@/lib/supabase/config";

import { OrganisationsClient } from "./organisations-client";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function paramValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function sourceLabel(source: string): string {
  if (source === "public.organisation") return "table public.organisation";
  if (source === "public.organization") return "table public.organization";
  return "derive de public.member";
}

export default async function OrganisationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = paramValue(params.q).trim();

  let loadError: string | null = null;
  let items: Awaited<ReturnType<typeof listOrganisations>>["items"] = [];
  let source = "public.member";
  let note: string | null = null;
  let canCreate = false;

  if (isSupabaseConfigured) {
    try {
      const result = await listOrganisations(query || undefined);
      items = result.items;
      source = result.source;
      note = result.source_note;
      canCreate = result.can_create;
    } catch (error) {
      console.error("Unable to load organisations", error);
      loadError = "Impossible de charger les organisations pour le moment.";
    }
  } else {
    loadError = "Supabase non configure. Ajoutez les variables d'environnement.";
  }

  return (
    <div className="space-y-6">
      {loadError ? (
        <Card>
          <CardDescription className="text-red-600">{loadError}</CardDescription>
        </Card>
      ) : null}

      <OrganisationsClient
        canCreate={canCreate}
        initialQuery={query}
        items={items}
        sourceLabel={sourceLabel(source)}
        sourceNote={note}
      />
    </div>
  );
}
