import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import type { MemberOnboardingReviewRecord } from "@/lib/backend/api";
import {
  buildIndigenceBreakdown,
  labelForIndigenceLevel,
  labelForStoredChoice,
} from "@/lib/onboarding/socioeconomic";

type MemberOnboardingReviewProps = {
  member: MemberOnboardingReviewRecord;
  locationLabels: {
    commune: string;
    organisation: string;
    prefecture: string;
    region: string;
  };
};

function textValue(value: string | null | undefined): string {
  const normalized = String(value ?? "").trim();
  return normalized || "-";
}

function yesNo(value: boolean | null | undefined): string {
  if (value === true) return "Oui";
  if (value === false) return "Non";
  return "-";
}

function listValues(values: Array<string | number | null | undefined> | null | undefined): string[] {
  return Array.from(
    new Set(
      (values ?? [])
        .map((value) => String(value ?? "").trim())
        .filter(Boolean),
    ),
  );
}

function displayList(values: Array<string | number | null | undefined> | null | undefined): string {
  const normalized = listValues(values);
  return normalized.length > 0 ? normalized.join(", ") : "-";
}

function skillNames(skills: MemberOnboardingReviewRecord["skills"]): string[] {
  return Array.from(
    new Set(
      (skills ?? [])
        .map((item) => String(item?.name ?? "").trim())
        .filter(Boolean),
    ),
  );
}

function joinModeLabel(value: string | null | undefined): string {
  if (value === "personal") return "Personnel";
  if (value === "association") return "Association";
  if (value === "enterprise") return "Entreprise";
  return textValue(value);
}

function celluleLabel(value: string | null | undefined): string {
  if (value === "engaged") return "Engage";
  if (value === "entrepreneur") return "Entrepreneur";
  if (value === "org_leader") return "Leader d'organisation";
  return textValue(value);
}

function contactPreferenceLabel(value: string | null | undefined): string {
  if (value === "whatsapp") return "WhatsApp";
  if (value === "email") return "Email";
  if (value === "call") return "Appel";
  return textValue(value);
}

function educationLabel(value: string | null | undefined): string {
  const labels: Record<string, string> = {
    autodidacte: "Autodidacte",
    formation_pro: "Formation pro",
    primaire: "Primaire",
    secondaire: "Secondaire",
    universitaire: "Universitaire",
  };
  return labels[value ?? ""] ?? textValue(value);
}

function occupationLabel(value: string | null | undefined): string {
  const labels: Record<string, string> = {
    entrepreneur: "Entrepreneur",
    etudiant: "Etudiant",
    independant: "Independant",
    recherche: "Recherche d'emploi",
    salarie: "Salarie",
  };
  return labels[value ?? ""] ?? textValue(value);
}

function tagList(values: string[] | null | undefined): string {
  const normalized = listValues((values ?? []).map((value) => labelForStoredChoice(value)));
  return normalized.length > 0 ? normalized.join(", ") : "-";
}

function oddList(values: number[] | null | undefined): string {
  const normalized = listValues((values ?? []).map((value) => `ODD ${value}`));
  return normalized.length > 0 ? normalized.join(", ") : "-";
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1 rounded-lg border border-border/70 bg-muted-surface/40 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="text-sm leading-6 text-foreground">{value}</p>
    </div>
  );
}

function Section({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <Card className="space-y-4">
      <div className="space-y-1">
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </div>
      <div className="grid gap-3 md:grid-cols-2">{children}</div>
    </Card>
  );
}

export function MemberOnboardingReview({
  member,
  locationLabels,
}: MemberOnboardingReviewProps) {
  const breakdown = buildIndigenceBreakdown({
    debtLevel: member.debt_level,
    dependentsCount: member.dependents_count,
    disabilityOrLimitation: member.disability_or_limitation,
    employmentDurationIfSearching: member.employment_duration_if_searching,
    foodSecurity: member.food_security,
    healthAccess: member.health_access,
    housingStatus: member.housing_status,
    incomeRange: member.income_range,
    incomeStability: member.income_stability,
    occupationStatus: member.occupation_status,
    recentShock: member.recent_shock,
    savingsLevel: member.savings_level,
    urgentNeeds: member.urgent_needs,
  });
  const totalPoints = breakdown.reduce((sum, item) => sum + item.points, 0);
  const indigenceLevelLabel = member.indigence_level
    ? labelForIndigenceLevel(member.indigence_level as "faible" | "moderee" | "forte" | "critique")
    : "-";
  const factorList = listValues(member.indigence_factors);

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>Fiche onboarding complete</CardTitle>
            <CardDescription>
              Lecture detaillee reservee aux roles Admin, CA et CN.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">Score {member.indigence_score ?? totalPoints}/100</Badge>
            <Badge variant="warning">{indigenceLevelLabel}</Badge>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Cellule primaire" value={celluleLabel(member.cellule_primary)} />
          <Field label="Cellule secondaire" value={celluleLabel(member.cellule_secondary)} />
          <Field label="Statut membre" value={textValue(member.status)} />
        </div>

        <div className="rounded-lg border border-border/70 bg-muted-surface/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Facteurs d&apos;indigence dominants
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {factorList.length > 0 ? (
              factorList.map((factor) => (
                <Badge key={factor} variant="default">
                  {factor}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted">Aucun facteur dominant enregistre.</span>
            )}
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="space-y-1">
          <CardTitle>Points attribues</CardTitle>
          <CardDescription>
            Detail de calcul du score socio-economique et d&apos;indigence.
          </CardDescription>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-muted-surface">
              <tr>
                <th className="px-3 py-2 font-semibold text-muted">Critere</th>
                <th className="px-3 py-2 font-semibold text-muted">Valeur</th>
                <th className="px-3 py-2 font-semibold text-muted">Points</th>
                <th className="px-3 py-2 font-semibold text-muted">Maximum</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((item) => (
                <tr key={item.code} className="border-t border-border">
                  <td className="px-3 py-2">{item.label}</td>
                  <td className="px-3 py-2 text-muted">{item.valueLabel}</td>
                  <td className="px-3 py-2 font-semibold">{item.points}</td>
                  <td className="px-3 py-2 text-muted">{item.maxPoints}</td>
                </tr>
              ))}
              <tr className="border-t border-border bg-muted-surface/40">
                <td className="px-3 py-2 font-semibold" colSpan={2}>
                  Total
                </td>
                <td className="px-3 py-2 font-semibold">{member.indigence_score ?? totalPoints}</td>
                <td className="px-3 py-2 text-muted">100</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Section title="A. Identite et contact">
        <Field label="Prenom" value={textValue(member.first_name)} />
        <Field label="Nom" value={textValue(member.last_name)} />
        <Field label="Telephone" value={textValue(member.phone)} />
        <Field label="Email" value={textValue(member.email)} />
        <Field label="Genre" value={textValue(member.gender)} />
        <Field label="Date de naissance" value={textValue(member.birth_date)} />
        <Field label="Tranche d'age" value={textValue(member.age_range)} />
        <Field label="Niveau d'etudes" value={educationLabel(member.education_level)} />
        <Field label="Statut d'occupation" value={occupationLabel(member.occupation_status)} />
        <Field label="Profession" value={textValue(member.profession_title)} />
      </Section>

      <Section title="B. Localisation">
        <Field label="Region" value={textValue(locationLabels.region)} />
        <Field label="Prefecture" value={textValue(locationLabels.prefecture)} />
        <Field label="Commune" value={textValue(locationLabels.commune)} />
        <Field label="Quartier / localite" value={textValue(member.locality)} />
        <Field label="Mobilite" value={yesNo(member.mobility)} />
        <Field label="Zones de mobilite" value={textValue(member.mobility_zones)} />
      </Section>

      <Section title="C. Profil CZI">
        <Field label="Mode d'adhesion" value={joinModeLabel(member.join_mode)} />
        <Field label="Organisation rattachee" value={textValue(locationLabels.organisation)} />
        <Field label="Nom organisation saisi" value={textValue(member.org_name)} />
        <Field label="Cellule primaire" value={celluleLabel(member.cellule_primary)} />
        <Field label="Cellule secondaire" value={celluleLabel(member.cellule_secondary)} />
        <Field label="Role dans l'organisation" value={textValue(member.org_role)} />
        <Field label="Nom organisation declaree" value={textValue(member.org_name_declared)} />
        <Field label="Type organisation partenaire" value={textValue(member.org_type)} />
        <Field label="Nom association" value={textValue(member.association_name)} />
        <Field label="Nom entreprise" value={textValue(member.enterprise_name)} />
        <Field label="Domaines d'engagement" value={displayList(member.engagement_domains)} />
        <Field label="Frequence d'engagement" value={textValue(member.engagement_frequency)} />
        <Field label="Action recente" value={textValue(member.engagement_recent_action)} />
        <Field label="Stade business" value={textValue(member.business_stage)} />
        <Field label="Secteur business" value={textValue(member.business_sector)} />
        <Field label="Besoins business" value={displayList(member.business_needs)} />
      </Section>

      <Section title="D. Competences et objectifs">
        <Field label="Competences libres" value={displayList(skillNames(member.skills))} />
        <Field label="Tags competences" value={tagList(member.skills_tags)} />
        <Field label="Interets libres" value={displayList(member.interests)} />
        <Field label="Tags interets" value={tagList(member.interests_tags)} />
        <Field label="ODD prioritaires" value={oddList(member.odd_priorities)} />
        <Field label="Objectif a 3-6 mois" value={textValue(member.goal_3_6_months)} />
      </Section>

      <Section title="E. Besoins et partenariat">
        <Field label="Types de support" value={displayList(member.support_types)} />
        <Field label="Disponibilite" value={textValue(member.availability)} />
        <Field
          label="Preference de contact"
          value={contactPreferenceLabel(member.contact_preference)}
        />
        <Field label="Demande partenaire" value={yesNo(member.partner_request)} />
      </Section>

      <Section title="G. Situation socio-economique">
        <Field
          label="Revenu mensuel moyen"
          value={textValue(labelForStoredChoice(member.income_range))}
        />
        <Field
          label="Stabilite du revenu"
          value={textValue(labelForStoredChoice(member.income_stability))}
        />
        <Field
          label="Personnes a charge"
          value={textValue(labelForStoredChoice(member.dependents_count))}
        />
        <Field
          label="Situation de logement"
          value={textValue(labelForStoredChoice(member.housing_status))}
        />
        <Field
          label="Acces regulier a la nourriture"
          value={textValue(labelForStoredChoice(member.food_security))}
        />
        <Field
          label="Acces aux soins"
          value={textValue(labelForStoredChoice(member.health_access))}
        />
        <Field
          label="Niveau d'epargne"
          value={textValue(labelForStoredChoice(member.savings_level))}
        />
        <Field
          label="Niveau d'endettement"
          value={textValue(labelForStoredChoice(member.debt_level))}
        />
        <Field
          label="Duree de recherche d'emploi"
          value={textValue(labelForStoredChoice(member.employment_duration_if_searching))}
        />
        <Field label="Besoins urgents" value={tagList(member.urgent_needs)} />
        <Field
          label="Evenement difficile recent"
          value={textValue(labelForStoredChoice(member.recent_shock))}
        />
        <Field
          label="Handicap ou limitation"
          value={yesNo(member.disability_or_limitation)}
        />
      </Section>

      <Section title="F. Consentements et validation">
        <Field label="Conditions acceptees" value={yesNo(member.consent_terms)} />
        <Field label="Consentement analytique" value={yesNo(member.consent_analytics)} />
        <Field
          label="Consentement IA agregee"
          value={yesNo(member.consent_ai_training_agg)}
        />
        <Field label="Valide par" value={textValue(member.validated_by)} />
        <Field label="Date de validation" value={textValue(member.validated_at)} />
        <Field label="Motif de validation" value={textValue(member.validation_reason)} />
      </Section>
    </div>
  );
}
