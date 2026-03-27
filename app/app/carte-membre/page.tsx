/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { FileImage, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentMemberCardOverview } from "@/lib/supabase/member-card";

import { MemberCardDownload } from "./member-card-download";
import { MemberPhotoField } from "./member-photo-field";
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
  if (value === "ready" || value === "approved" || value === "delivered") {
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
    case "pending":
      return "En attente";
    case "draft":
      return "Brouillon";
    case "ready":
      return "Prête";
    case "printed":
      return "Imprimée";
    case "delivered":
      return "Livrée";
    case "cancelled":
      return "Annulée";
    case "missing":
      return "Photo manquante";
    case "uploaded":
      return "Photo reçue";
    case "approved":
      return "Photo validée";
    case "rejected":
      return "Photo rejetée";
    default:
      return value || "-";
  }
}

function canEditRequest(cardStatus: string | null | undefined) {
  return !cardStatus || cardStatus === "draft" || cardStatus === "cancelled";
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
  const requestEditable = request ? canEditRequest(request.card_status) : true;
  const formDisabled = !member || !requestEditable;
  const cardLabel = request?.card_number ?? "Aucun numéro généré pour le moment";
  const fullName = member ? [member.first_name, member.last_name].filter(Boolean).join(" ") : "";
  const hasName = Boolean(fullName);
  const hasContact = Boolean(member?.phone || member?.email);
  const hasPhoto =
    Boolean(member?.photo_url) || member?.photo_status === "uploaded" || member?.photo_status === "approved";
  const hasBaseCardInformation = hasName && hasContact;
  const memberDisplayName = fullName || "membre CZI";

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div
        className="relative overflow-hidden rounded-2xl px-8 py-7 text-white shadow-md"
        style={{ background: "linear-gradient(120deg, #0F5F6B 0%, #1A8A9B 60%, #25B4C8 100%)" }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "repeating-linear-gradient(45deg, rgba(255,255,255,.03) 0, rgba(255,255,255,.03) 1px, transparent 0, transparent 24px)",
          }}
        />
        <div className="relative z-10">
          <p className="text-[.65rem] font-bold uppercase tracking-[.14em] text-white/60 mb-[6px]">Mon espace</p>
          <h1 className="text-[1.6rem] font-bold leading-[1.15] text-white mb-[6px]" style={{ fontFamily: "'Syne', sans-serif" }}>
            Carte de membre CZI
          </h1>
          <p className="text-[.85rem] text-white/65">Configurez et téléchargez votre carte de membre au format PDF.</p>
        </div>
      </div>

      {loadError ? (
        <Card className="border-red-200 bg-red-50">
          <CardDescription className="text-red-700">{loadError}</CardDescription>
        </Card>
      ) : null}
      {errorMessage ? (
        <Card className="border-red-200 bg-red-50">
          <CardDescription className="text-red-700">{errorMessage}</CardDescription>
        </Card>
      ) : null}
      {noticeMessage ? (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardDescription className="text-emerald-700">{noticeMessage}</CardDescription>
        </Card>
      ) : null}

      {!member && !loadError ? (
        <Card className="space-y-4">
          <CardTitle>Fiche membre requise</CardTitle>
          <CardDescription>
            La carte de membre devient disponible après la création de votre fiche membre.
          </CardDescription>
          <div className="flex flex-wrap gap-3">
            <Link href="/onboarding">
              <Button>Compléter ma fiche membre</Button>
            </Link>
            <Link href="/app/dashboard">
              <Button variant="secondary">Retour au tableau de bord</Button>
            </Link>
          </div>
        </Card>
      ) : null}

      {member ? (
        <>
          <section className="grid gap-4 md:grid-cols-2">
            {[
              {
                label: "Photo",
                value: formatStatusLabel(member.photo_status),
                hint: member.photo_preview_url ? "Photo enregistrée." : "Aucune photo enregistrée.",
                icon: <FileImage size={18} />,
                bar: "#1A8A9B",
                iconBg: "rgba(26,138,155,.1)",
                iconColor: "#1A8A9B",
                textColor: "#1A8A9B",
              },
              {
                label: "Statut carte",
                value: formatStatusLabel(request?.card_status ?? "draft"),
                hint: cardLabel,
                icon: <ShieldCheck size={18} />,
                bar: "#43A047",
                iconBg: "rgba(67,160,71,.1)",
                iconColor: "#43A047",
                textColor: "#43A047",
              },
            ].map(({ label, value, hint, icon, bar, iconBg, iconColor, textColor }) => (
              <div
                key={label}
                className="relative overflow-hidden rounded-[14px] border border-[#E2E8F0] bg-white"
                style={{ boxShadow: "0 1px 4px rgba(18,32,46,.06)" }}
              >
                <div style={{ height: 3, background: bar, borderRadius: "14px 14px 0 0" }} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <p className="text-[.65rem] font-bold uppercase tracking-[.12em] text-[#7A8CA0]">{label}</p>
                    <div className="h-8 w-8 rounded-[8px] grid place-items-center flex-shrink-0" style={{ background: iconBg }}>
                      <span style={{ color: iconColor }}>{icon}</span>
                    </div>
                  </div>
                  <p className="text-xl font-bold leading-snug" style={{ color: textColor }}>{value}</p>
                  <p className="mt-1.5 text-[.72rem] text-[#7A8CA0] line-clamp-2">{hint}</p>
                </div>
              </div>
            ))}
            {member.photo_preview_url ? (
              <div className="overflow-hidden rounded-xl border border-border md:col-span-2 xl:col-span-1">
                <img
                  alt={`Photo de ${memberDisplayName}`}
                  className="h-40 w-full object-cover"
                  src={member.photo_preview_url}
                />
              </div>
            ) : null}
          </section>

          {member.photo_rejection_reason ? (
            <Card>
              <CardDescription className="text-amber-700">
                Photo rejetée: {member.photo_rejection_reason}
              </CardDescription>
            </Card>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="space-y-4">
              <div>
                <CardTitle>Configurer votre carte</CardTitle>
                <CardDescription className="mt-2">
                  Activez votre demande, ajoutez votre photo et complétez vos informations.
                </CardDescription>
              </div>
              {!requestEditable && request ? (
                <CardDescription className="text-amber-700">
                  Cette demande n&apos;est plus modifiable depuis votre espace car elle est déjà en
                  traitement ou finalisée.
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
                  Je souhaite ma carte de membre CZI
                </label>
                <MemberPhotoField
                  currentPhotoExists={Boolean(member.photo_url)}
                  currentPreviewUrl={member.photo_preview_url}
                  currentStatusLabel={formatStatusLabel(member.photo_status)}
                  disabled={formDisabled}
                  memberName={memberDisplayName}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="profession-title">
                      Profession <span className="text-red-500">*</span>
                    </label>
                    <Input
                      defaultValue={member.profession_title ?? ""}
                      disabled={formDisabled}
                      id="profession-title"
                      name="profession_title"
                      placeholder="Ex : Enseignant, Médecin…"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="locality">
                      Adresse / Localité <span className="text-red-500">*</span>
                    </label>
                    <Input
                      defaultValue={member.locality ?? ""}
                      disabled={formDisabled}
                      id="locality"
                      name="locality"
                      placeholder="Ex : Lomé, Quartier Bè…"
                      required
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button disabled={formDisabled} type="submit">
                    {request ? "Mettre à jour la demande" : "Enregistrer la demande"}
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
                      {request?.requested ? "Demandée" : "Non demandée"}
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
                      ? "La photo est bien enregistrée et pourra être utilisée pour la génération."
                      : "Ajoutez une photo pour permettre l'édition de la carte."}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-muted-surface/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    Informations disponibles
                  </p>
                  <dl className="mt-3 grid gap-3 text-sm">
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-muted">Nom complet</dt>
                      <dd className="text-right font-medium">{fullName || "A compléter"}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-muted">Téléphone</dt>
                      <dd className="text-right font-medium">{member.phone || "A compléter"}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-muted">Email</dt>
                      <dd className="text-right font-medium">{member.email || "A compléter"}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-muted">Photo</dt>
                      <dd className="text-right font-medium">{hasPhoto ? "Disponible" : "À fournir"}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-muted">Profil CZI</dt>
                      <dd className="text-right font-medium">{member.join_mode || "A compléter"}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-muted">Cellule principale</dt>
                      <dd className="text-right font-medium">{member.cellule_primary || "A compléter"}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-muted">Profession</dt>
                      <dd className="text-right font-medium">{member.profession_title || "A compléter"}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-muted">Localité</dt>
                      <dd className="text-right font-medium">{member.locality || "A compléter"}</dd>
                    </div>
                  </dl>
                  <p className="mt-4 text-sm text-foreground/80">
                    {hasBaseCardInformation
                      ? "Les informations de base pour établir une carte simple sont bien présentes. La photo reste indispensable avant édition."
                      : "Complétez au minimum le nom complet et un contact avant l'établissement de la carte."}
                  </p>
                </div>
                {/* Card download — available once photo is uploaded/approved */}
                {(member.photo_status === "uploaded" || member.photo_status === "approved") && hasBaseCardInformation ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                      Carte prête à générer
                    </p>
                    <p className="mt-2 mb-3 text-sm text-foreground/80">
                      Votre photo et vos informations sont disponibles. Téléchargez votre carte
                      de membre CZI au format PDF — disponible à tout moment.
                    </p>
                    <MemberCardDownload member={member} request={request} role={overview?.role ?? null} />
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-muted-surface/40 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                      Carte numérique
                    </p>
                    <p className="mt-2 text-sm text-foreground/80">
                      La génération de votre carte PDF sera disponible dès que votre photo sera
                      ajoutée et que vos informations (nom + contact) seront complètes.
                    </p>
                  </div>
                )}
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
