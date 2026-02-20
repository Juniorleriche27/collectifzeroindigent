"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Building2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { OrganisationCardItem } from "@/lib/backend/api";

import { createOrganisationAction, initialOrganisationCreateState } from "./actions";

type OrganisationsClientProps = {
  canCreate: boolean;
  items: OrganisationCardItem[];
  initialQuery: string;
  sourceLabel: string;
  sourceNote: string | null;
};

export function OrganisationsClient({
  canCreate,
  items,
  initialQuery,
  sourceLabel,
  sourceNote,
}: OrganisationsClientProps) {
  const [open, setOpen] = useState(false);
  const [state, createAction, isPending] = useActionState(
    createOrganisationAction,
    initialOrganisationCreateState,
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Organisations
          </p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">Gestion des organisations</h2>
          <CardDescription className="mt-2">
            Source: {sourceLabel}
            {sourceNote ? ` - ${sourceNote}` : ""}
          </CardDescription>
        </div>
        <Button disabled={!canCreate} onClick={() => setOpen(true)} title={!canCreate ? sourceNote ?? "" : ""}>
          Creer une organisation
        </Button>
      </div>

      <Card className="space-y-3">
        <CardTitle className="text-base">Recherche</CardTitle>
        <form className="flex flex-wrap items-center gap-3" method="get">
          <Input
            className="min-w-[280px] flex-1"
            defaultValue={initialQuery}
            name="q"
            placeholder="Nom organisation..."
          />
          <Button type="submit" variant="secondary">
            Rechercher
          </Button>
          <Link href="/app/organisations">
            <Button type="button" variant="ghost">
              Reinitialiser
            </Button>
          </Link>
        </form>
        <CardDescription>{items.length} organisation(s) visible(s).</CardDescription>
      </Card>

      {items.length === 0 ? (
        <Card>
          <CardDescription>Aucune organisation ne correspond a votre recherche.</CardDescription>
        </Card>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((org) => (
            <Card key={org.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-muted-surface p-3 text-primary">
                  <Building2 size={20} />
                </div>
                <Badge>{org.category}</Badge>
              </div>
              <div>
                <CardTitle>{org.name}</CardTitle>
                <CardDescription className="mt-2">{org.members} membre(s)</CardDescription>
              </div>
            </Card>
          ))}
        </section>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-xl space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle>Creer une organisation</CardTitle>
              <Button size="sm" type="button" variant="ghost" onClick={() => setOpen(false)}>
                Fermer
              </Button>
            </div>
            <CardDescription>
              Cette insertion fonctionne uniquement si une table `organisation` ou `organization`
              existe dans Supabase.
            </CardDescription>
            <form action={createAction} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium" htmlFor="org-name">
                  Nom organisation
                </label>
                <Input id="org-name" name="name" placeholder="Nom de l'organisation" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="org-type">
                  Type
                </label>
                <Select id="org-type" name="type" defaultValue="association" required>
                  <option value="association">Association</option>
                  <option value="enterprise">Entreprise</option>
                </Select>
              </div>
              <div className="flex items-end">
                <Button disabled={isPending} type="submit">
                  {isPending ? "Creation..." : "Enregistrer"}
                </Button>
              </div>
              {state.error ? <p className="text-sm text-red-600 md:col-span-2">{state.error}</p> : null}
              {state.success ? (
                <p className="text-sm text-emerald-700 md:col-span-2">{state.success}</p>
              ) : null}
            </form>
          </Card>
        </div>
      ) : null}
    </>
  );
}
