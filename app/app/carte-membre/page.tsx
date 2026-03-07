import Link from "next/link";
import { CreditCard, FileImage, ShieldCheck, Truck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getCurrentMemberCardOverview } from "@/lib/supabase/member-card";

import { saveMemberCardRequestAction } from "./actions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function paramValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function badgeVariant(
  value: string | null,
): "default" | "success" | "warning" | "danger" {
  if (value === "paid" || value === "ready" || value === "approved" || value === "delivered") {
    return "success";
  }
  if (value === "pending" || value === "uploaded" || value === "printed") {
    return "warning";
  }
  if (value === "failed" || value === "cancelled" || value === "rejected") {
    return "danger";
  }
  return "default";
}

function formatStatusLabel(value: string | null | undefined): string {
  switch (value) {
    case "unpaid":
      return "Non paye";
    case "pending":
      return "En attente";
    case "paid":
      return "Paye";
    case "failed":
      return "Echec";
    case "refunded":
      return "Rembourse";
    case "draft":
      return "Brouillon";
    case "ready":
      return "Prete";
    case "printed":
      return "Imprimee";
    case "delivered":
      return "Livree";
    case "cancelled":
      return "Annulee";
    case "missing":
      return "Photo manquante";
    case "uploaded":
      return "Photo recue";
    case "approved":
      return "Photo validee";
    case "rejected":
      return "Photo rejetee";
    default:
      return value || "-";
  }
}

function formatDeliveryModeLabel(value: string | null | undefined): string {
  if (value === "delivery") {
    return "Livraison";
  }
  return "Retrait";
}

function canEditRequest(paymentStatus: string | null | undefined, cardStatus: string | null | undefined) {
  const editablePayment = paymentStatus === "unpaid" || paymentStatus === "pending" || paymentStatus === "failed";
  const editableCard = cardStatus === "draft" || cardStatus === "cancelled";
  return editablePayment && editableCard;
}

export default async function MemberCardPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const errorMessage = paramValue(params.error).trim();
  const noticeMessage = paramValue(params.notice).trim();

  let loadError: string | null = null;
  let overview: Awaited<ReturnType<typeof getCurrentMemberCardOverview>> | null = null;

  try {
    overview = await getCurrentMemberCardOverview();
  } catch (error) {
    console.error("Unable to load member card overview", error);
    loadError = error instanceof Error ? error.message : "Impossible de charger la carte membre.";
  }

  const member = overview?.member ?? null;
  const request = overview?.request ?? null;
  const requestEditable = request ? canEditRequest(request.payment_status, request.card_status) : true;
  const formDisabled = !member || !requestEditable;
  const cardLabel = request?.card_number ?? "Aucun numero genere pour le moment";
  const defaultDeliveryContact = member
    ? request?.delivery_contact ||
      [member.first_name, member.last_name].filter(Boolean).join(" ") ||
      member.phone ||
      member.email ||
      ""
    : "";
  const fullName = member ? [member.first_name, member.last_name].filter(Boolean).join(" ") : "";
  const hasName = Boolean(fullName);
  const hasContact = Boolean(member?.phone || member?.email);
  const hasPhoto =
    Boolean(member?.photo_url) || member?.photo_status === "uploaded" || member?.photo_status === "approved";
  const hasDeliveryContact = Boolean(defaultDeliveryContact.trim());
  const hasDeliveryAddress = Boolean(request?.delivery_address?.trim());
  const hasBaseCardInformation = hasName && hasContact;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Carte membre</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">Carte de membre CZI</h2>
          <CardDescription className="mt-2">
            Demande, photo et mode de remise de votre carte membre a 2900 F.
          </CardDescription>
        </div>
        <Badge variant="warning">Paiement bientot disponible</Badge>
      </div>

      {loadError ? (
        <Card>
          <CardDescription className="text-red-600">{loadError}</CardDescription>
        </Card>
      ) : null}
      {errorMessage ? (
        <Card>
          <CardDescription className="text-red-600">{errorMessage}</CardDescription>
        </Card>
      ) : null}
      {noticeMessage ? (
        <Card>
          <CardDescription className="text-emerald-700">{noticeMessage}</CardDescription>
        </Card>
      ) : null}

      {!member && !loadError ? (
        <Card className="space-y-4">
          <CardTitle>Onboarding requis</CardTitle>
          <CardDescription>
            La carte membre devient disponible apres la creation de votre fiche membre.
          </CardDescription>
          <div className="flex flex-wrap gap-3">
            <Link href="/onboarding">
              <Button>Completer l&apos;onboarding</Button>
            </Link>
            <Link href="/app/dashboard">
              <Button variant="secondary">Retour dashboard</Button>
            </Link>
          </div>
        </Card>
      ) : null}

      {member ? (
        <>
          <section className="grid gap-4 md:grid-cols-4">
            <Card>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardDescription>Photo</CardDescription>
                  <CardTitle className="mt-2 text-2xl">{formatStatusLabel(member.photo_status)}</CardTitle>
                </div>
                <FileImage className="text-primary" size={22} />
              </div>
              <p className="mt-3 text-sm text-muted">
                {member.photo_url ? "Lien photo enregistre." : "Aucune photo enregistree."}
              </p>
            </Card>
            <Card>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardDescription>Paiement</CardDescription>
                  <CardTitle className="mt-2 text-2xl">{formatStatusLabel(request?.payment_status ?? "unpaid")}</CardTitle>
                </div>
                <CreditCard className="text-primary" size={22} />
              </div>
              <p className="mt-3 text-sm text-muted">Montant fixe: {request?.price_cfa ?? 2900} F</p>
            </Card>
            <Card>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardDescription>Statut carte</CardDescription>
                  <CardTitle className="mt-2 text-2xl">{formatStatusLabel(request?.card_status ?? "draft")}</CardTitle>
                </div>
                <ShieldCheck className="text-primary" size={22} />
              </div>
              <p className="mt-3 text-sm text-muted">{cardLabel}</p>
            </Card>
            <Card>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardDescription>Remise</CardDescription>
                  <CardTitle className="mt-2 text-2xl">{formatDeliveryModeLabel(request?.delivery_mode)}</CardTitle>
                </div>
                <Truck className="text-primary" size={22} />
              </div>
              <p className="mt-3 text-sm text-muted">
                {request?.delivery_contact || member.phone || member.email || "Contact a definir"}
              </p>
            </Card>
          </section>

          {member.photo_rejection_reason ? (
            <Card>
              <CardDescription className="text-amber-700">
                Photo rejetee: {member.photo_rejection_reason}
              </CardDescription>
            </Card>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="space-y-4">
              <div>
                <CardTitle>Configurer votre demande</CardTitle>
                <CardDescription className="mt-2">
                  Activez votre demande, ajoutez votre photo et precisez la remise. Le paiement en
                  ligne n&apos;est pas encore ouvert.
                </CardDescription>
              </div>
              {!requestEditable && request ? (
                <CardDescription className="text-amber-700">
                  Cette demande n&apos;est plus modifiable depuis votre espace car elle est deja en
                  traitement ou finalisee.
                </CardDescription>
              ) : null}
              <form action={saveMemberCardRequestAction} className="grid gap-4">
                <input name="request_id" type="hidden" value={request?.id ?? ""} />
                <label className="inline-flex items-center gap-2 text-sm font-medium">
                  <input
                    defaultChecked={request?.requested ?? false}
                    disabled={formDisabled}
                    name="requested"
                    type="checkbox"
                  />
                  Je souhaite ma carte de membre CZI (2900 F)
                </label>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="card-photo-url">
                    Lien photo provisoire
                  </label>
                  <Input
                    defaultValue={member.photo_url ?? ""}
                    disabled={formDisabled}
                    id="card-photo-url"
                    name="photo_url"
                    placeholder="https://.../photo.jpg"
                    type="url"
                  />
                  <p className="text-xs text-muted">
                    En attendant le televersement direct, collez le lien de la photo a utiliser sur la carte.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="delivery-mode">
                      Mode de remise
                    </label>
                    <Select
                      defaultValue={request?.delivery_mode ?? "pickup"}
                      disabled={formDisabled}
                      id="delivery-mode"
                      name="delivery_mode"
                    >
                      <option value="pickup">Retrait</option>
                      <option value="delivery">Livraison</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="delivery-contact">
                      Contact remise
                    </label>
                    <Input
                      defaultValue={defaultDeliveryContact}
                      disabled={formDisabled}
                      id="delivery-contact"
                      name="delivery_contact"
                      placeholder="Nom et telephone"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="delivery-address">
                    Adresse de livraison
                  </label>
                  <textarea
                    className="min-h-[110px] w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/20 disabled:pointer-events-none disabled:opacity-60"
                    defaultValue={request?.delivery_address ?? ""}
                    disabled={formDisabled}
                    id="delivery-address"
                    name="delivery_address"
                    placeholder="Commune, quartier, precision de remise"
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button disabled={formDisabled} type="submit">
                    {request ? "Mettre a jour la demande" : "Enregistrer la demande"}
                  </Button>
                  <Button disabled type="button" variant="secondary">
                    Paiement bientot disponible
                  </Button>
                </div>
              </form>
            </Card>

            <Card className="space-y-4">
              <CardTitle>Statut actuel</CardTitle>
              <div className="grid gap-3">
                <div className="rounded-xl border border-border bg-muted-surface/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    Demande
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant={request?.requested ? "success" : "default"}>
                      {request?.requested ? "Demandee" : "Non demandee"}
                    </Badge>
                    <Badge variant={badgeVariant(request?.payment_status ?? "unpaid")}>
                      {formatStatusLabel(request?.payment_status ?? "unpaid")}
                    </Badge>
                    <Badge variant={badgeVariant(request?.card_status ?? "draft")}>
                      {formatStatusLabel(request?.card_status ?? "draft")}
                    </Badge>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-muted-surface/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    Photo
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant={badgeVariant(member.photo_status)}>
                      {formatStatusLabel(member.photo_status)}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted">
                    {member.photo_url
                      ? "La photo est bien enregistree et pourra etre utilisee pour la generation."
                      : "Ajoutez une photo pour permettre l'edition de la carte."}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-muted-surface/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    Informations disponibles
                  </p>
                  <dl className="mt-3 grid gap-3 text-sm">
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-muted">Nom complet</dt>
                      <dd className="text-right font-medium">{fullName || "A completer"}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-muted">Telephone</dt>
                      <dd className="text-right font-medium">{member.phone || "A completer"}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-muted">Email</dt>
                      <dd className="text-right font-medium">{member.email || "A completer"}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-muted">Photo</dt>
                      <dd className="text-right font-medium">{hasPhoto ? "Disponible" : "A fournir"}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-muted">Contact remise</dt>
                      <dd className="text-right font-medium">
                        {hasDeliveryContact ? defaultDeliveryContact : "A completer"}
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-muted">Adresse livraison</dt>
                      <dd className="text-right font-medium">
                        {request?.delivery_mode === "delivery"
                          ? hasDeliveryAddress
                            ? "Renseignee"
                            : "A completer"
                          : "Non requise"}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-4 text-sm text-foreground/80">
                    {hasBaseCardInformation
                      ? "Les informations de base pour etablir une carte simple sont bien presentes. La photo reste indispensable avant edition."
                      : "Completer au minimum le nom complet et un contact avant l'etablissement de la carte."}
                  </p>
                </div>
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/70">
                    Paiement
                  </p>
                  <p className="mt-3 text-sm text-foreground/80">
                    La demande peut etre enregistree des maintenant. Le paiement en ligne sera active
                    des son ouverture.
                  </p>
                </div>
                <Link href="/app/dons">
                  <Button className="w-full" type="button" variant="ghost">
                    Ouvrir aussi le module dons
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
