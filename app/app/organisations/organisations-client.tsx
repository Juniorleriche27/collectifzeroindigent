"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Handshake, Link2, PlusCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { MemberRecord, OrganisationCardItem } from "@/lib/backend/api";

import { attachPartnershipAction, createOrganisationAction } from "./actions";
import type { OrganisationCreateState, PartnershipAttachState } from "./actions";

type PartnershipActionType =
  | "create-association"
  | "create-enterprise"
  | "link-association"
  | "link-enterprise";

type OrganisationsClientProps = {
  canCreate: boolean;
  currentMember: MemberRecord | null;
  initialQuery: string;
  items: OrganisationCardItem[];
  sourceLabel: string;
  sourceNote: string | null;
};

function normalizedCategory(item: OrganisationCardItem): string {
  return item.category.trim().toLowerCase();
}

function isAssociation(item: OrganisationCardItem): boolean {
  return normalizedCategory(item).includes("association");
}

function isEnterprise(item: OrganisationCardItem): boolean {
  const category = normalizedCategory(item);
  return category.includes("entreprise") || category.includes("enterprise");
}

function actionTitle(action: PartnershipActionType): string {
  if (action === "create-enterprise") return "Creer une entreprise";
  if (action === "create-association") return "Creer une association";
  if (action === "link-enterprise") return "Ajouter son entreprise";
  return "Ajouter son association";
}

export function OrganisationsClient({
  canCreate,
  currentMember,
  items,
  initialQuery,
  sourceLabel,
  sourceNote,
}: OrganisationsClientProps) {
  const router = useRouter();
  const createFormRef = useRef<HTMLFormElement>(null);
  const attachFormRef = useRef<HTMLFormElement>(null);
  const initialCreateState: OrganisationCreateState = {
    error: null,
    success: null,
  };
  const initialAttachState: PartnershipAttachState = {
    error: null,
    success: null,
  };

  const [createState, createAction, createPending] = useActionState(
    createOrganisationAction,
    initialCreateState,
  );
  const [attachState, attachAction, attachPending] = useActionState(
    attachPartnershipAction,
    initialAttachState,
  );
  const [openAction, setOpenAction] = useState<PartnershipActionType | null>(null);
  const [selectedAttachId, setSelectedAttachId] = useState("");
  const [selectedAttachName, setSelectedAttachName] = useState("");

  const associationItems = useMemo(() => items.filter(isAssociation), [items]);
  const enterpriseItems = useMemo(() => items.filter(isEnterprise), [items]);

  const linkActionIsAssociation = openAction === "link-association";
  const linkActionIsEnterprise = openAction === "link-enterprise";
  const currentLinkItems = linkActionIsAssociation
    ? associationItems
    : linkActionIsEnterprise
      ? enterpriseItems
      : [];

  useEffect(() => {
    if (!createState.success) return;
    createFormRef.current?.reset();
    router.refresh();
  }, [createState.success, router]);

  useEffect(() => {
    if (!attachState.success) return;
    attachFormRef.current?.reset();
    router.refresh();
  }, [attachState.success, router]);

  const actionCards = [
    {
      action: "create-enterprise" as const,
      icon: PlusCircle,
      summary: "Creer une nouvelle entreprise partenaire dans le reseau CZI.",
      title: "Creer une entreprise",
    },
    {
      action: "create-association" as const,
      icon: PlusCircle,
      summary: "Creer une nouvelle association/mouvement partenaire.",
      title: "Creer une association",
    },
    {
      action: "link-enterprise" as const,
      icon: Link2,
      summary: "Rattacher votre profil a une entreprise existante.",
      title: "Ajouter son entreprise",
    },
    {
      action: "link-association" as const,
      icon: Handshake,
      summary: "Rattacher votre profil a une association existante.",
      title: "Ajouter son association",
    },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Partenariat</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">Partenariat CZI</h2>
          <CardDescription className="mt-2">
            Source organisations: {sourceLabel}
            {sourceNote ? ` - ${sourceNote}` : ""}
          </CardDescription>
        </div>
      </div>

      <Card className="space-y-2">
        <CardTitle className="text-base">Votre rattachement actuel</CardTitle>
        <CardDescription>
          {currentMember?.org_name
            ? `${currentMember.org_name} (${currentMember.join_mode ?? "non defini"})`
            : "Aucun partenariat rattache pour le moment."}
        </CardDescription>
      </Card>

      {!canCreate ? (
        <Card>
          <CardDescription className="text-amber-700">
            Creation table organisation desactivee: {sourceNote ?? "table organisation absente."}
          </CardDescription>
        </Card>
      ) : null}

      <Card className="space-y-3">
        <CardTitle className="text-base">Recherche partenaires</CardTitle>
        <form className="flex flex-wrap items-center gap-3" method="get">
          <Input
            className="min-w-[280px] flex-1"
            defaultValue={initialQuery}
            name="q"
            placeholder="Nom entreprise/association..."
          />
          <Button type="submit" variant="secondary">
            Rechercher
          </Button>
          <Link href="/app/partenariat">
            <Button type="button" variant="ghost">
              Reinitialiser
            </Button>
          </Link>
        </form>
        <CardDescription>
          {items.length} partenaire(s) visible(s) | {enterpriseItems.length} entreprise(s) |{" "}
          {associationItems.length} association(s)
        </CardDescription>
      </Card>

      <section className="grid gap-4 md:grid-cols-2">
        {actionCards.map((entry) => {
          const Icon = entry.icon;
          const disabled =
            (entry.action === "create-association" || entry.action === "create-enterprise") && !canCreate;
          return (
            <Card className="space-y-3" key={entry.action}>
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-muted-surface p-3 text-primary">
                  <Icon size={18} />
                </div>
                <Badge>{entry.action.includes("association") ? "association" : "entreprise"}</Badge>
              </div>
              <CardTitle className="text-lg">{entry.title}</CardTitle>
              <CardDescription>{entry.summary}</CardDescription>
              <Button
                disabled={disabled}
                onClick={() => {
                  setSelectedAttachId("");
                  setSelectedAttachName("");
                  setOpenAction(entry.action);
                }}
                type="button"
              >
                Ouvrir
              </Button>
            </Card>
          );
        })}
      </section>

      {items.length === 0 ? (
        <Card>
          <CardDescription>Aucun partenaire ne correspond a votre recherche.</CardDescription>
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

      {openAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-xl space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle>{actionTitle(openAction)}</CardTitle>
              <Button size="sm" type="button" variant="ghost" onClick={() => setOpenAction(null)}>
                Fermer
              </Button>
            </div>

            {(openAction === "create-association" || openAction === "create-enterprise") ? (
              <form ref={createFormRef} action={createAction} className="grid gap-4">
                <input
                  name="type"
                  type="hidden"
                  value={openAction === "create-enterprise" ? "enterprise" : "association"}
                />
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="partner-create-name">
                    Nom
                  </label>
                  <Input
                    id="partner-create-name"
                    name="name"
                    placeholder={
                      openAction === "create-enterprise"
                        ? "Ex: CZI Ventures"
                        : "Ex: Association Jeunes Leaders"
                    }
                    required
                  />
                </div>
                {createState.error ? <p className="text-sm text-red-600">{createState.error}</p> : null}
                {createState.success ? (
                  <p className="text-sm text-emerald-700">{createState.success}</p>
                ) : null}
                <Button disabled={createPending} type="submit">
                  {createPending ? "Creation..." : "Valider"}
                </Button>
              </form>
            ) : (
              <form ref={attachFormRef} action={attachAction} className="grid gap-4">
                <input name="allow_id" type="hidden" value={canCreate ? "1" : "0"} />
                <input
                  name="mode"
                  type="hidden"
                  value={openAction === "link-enterprise" ? "enterprise" : "association"}
                />
                <input name="organisation_id" type="hidden" value={selectedAttachId} />
                <input name="organisation_name" type="hidden" value={selectedAttachName} />
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="partner-link-select">
                    Partenaire existant
                  </label>
                  <Select
                    id="partner-link-select"
                    onChange={(event) => {
                      const id = event.target.value;
                      const selected = currentLinkItems.find((item) => item.id === id);
                      setSelectedAttachId(id);
                      setSelectedAttachName(selected?.name ?? "");
                    }}
                    required
                    value={selectedAttachId}
                  >
                    <option value="">Selectionner</option>
                    {currentLinkItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </Select>
                </div>
                {currentLinkItems.length === 0 ? (
                  <p className="text-sm text-amber-700">
                    Aucun partenaire de cette categorie disponible.
                  </p>
                ) : null}
                {attachState.error ? <p className="text-sm text-red-600">{attachState.error}</p> : null}
                {attachState.success ? (
                  <p className="text-sm text-emerald-700">{attachState.success}</p>
                ) : null}
                <Button disabled={attachPending || currentLinkItems.length === 0} type="submit">
                  {attachPending ? "Ajout..." : "Ajouter a mon profil"}
                </Button>
              </form>
            )}
          </Card>
        </div>
      ) : null}
    </>
  );
}
