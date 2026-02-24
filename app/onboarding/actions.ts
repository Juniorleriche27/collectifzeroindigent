"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { completeOnboarding } from "@/lib/backend/api";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getLinkedMemberIdFromProfile } from "@/lib/supabase/member";
import { createClient } from "@/lib/supabase/server";

export type OnboardingState = {
  error: string | null;
};

const joinModes = new Set(["personal", "association", "enterprise"]);
const celluleValues = new Set(["engaged", "entrepreneur", "org_leader"]);
const contactPreferenceValues = new Set(["whatsapp", "email", "call"]);
const orgTypes = new Set(["association", "enterprise"]);
const allowedOdd = new Set([1, 2, 3, 4, 5, 6, 8, 13, 16]);

function formValue(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function formValues(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);
}

function formBoolean(formData: FormData, key: string): boolean {
  const value = String(formData.get(key) ?? "")
    .trim()
    .toLowerCase();
  return value === "on" || value === "true" || value === "1";
}

function parseCsv(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

function normalizeOnboardingError(message: string): string {
  if (/infinite recursion detected in policy.*member/i.test(message)) {
    return (
      "Erreur RLS sur la table member (policy recursive). " +
      "Appliquez le script SQL `sql/2026-02-21_fix_member_profile_rls.sql` dans Supabase, puis reessayez."
    );
  }
  return message;
}

export async function submitOnboarding(
  _previousState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  if (!isSupabaseConfigured) {
    return {
      error:
        "Supabase non configure. Ajoutez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Session invalide. Reconnectez-vous." };
  }

  let linkedMemberId: string | null = null;
  try {
    linkedMemberId = await getLinkedMemberIdFromProfile(user.id);
  } catch (error) {
    console.error("Unable to check linked member before onboarding submit", error);
  }
  if (linkedMemberId) {
    redirect("/app/dashboard");
  }

  const firstName = formValue(formData, "first_name");
  const lastName = formValue(formData, "last_name");
  const phone = formValue(formData, "phone");
  const email = formValue(formData, "email");
  const gender = formValue(formData, "gender");
  const birthDate = formValue(formData, "birth_date");
  const ageRange = formValue(formData, "age_range");
  const educationLevel = formValue(formData, "education_level");
  const occupationStatus = formValue(formData, "occupation_status");
  const professionTitle = formValue(formData, "profession_title");

  const regionId = formValue(formData, "region_id");
  const prefectureId = formValue(formData, "prefecture_id");
  const communeId = formValue(formData, "commune_id");
  const locality = formValue(formData, "locality");
  const mobility = formBoolean(formData, "mobility");
  const mobilityZones = formValue(formData, "mobility_zones");

  const joinMode = formValue(formData, "join_mode");
  const cellulePrimaryInput = formValue(formData, "cellule_primary");
  const celluleSecondaryInput = formValue(formData, "cellule_secondary");

  const engagementDomains = formValues(formData, "engagement_domains");
  const engagementFrequency = formValue(formData, "engagement_frequency");
  const engagementRecentAction = formValue(formData, "engagement_recent_action");

  const businessStage = formValue(formData, "business_stage");
  const businessSector = formValue(formData, "business_sector");
  const businessNeeds = formValues(formData, "business_needs");

  const orgRole = formValue(formData, "org_role");
  const orgNameDeclared = formValue(formData, "org_name_declared");

  const skillsText = formValue(formData, "skills_text");
  const interestsText = formValue(formData, "interests_text");
  const oddPrioritiesRaw = formValues(formData, "odd_priorities");

  const goalShortTerm = formValue(formData, "goal_3_6_months");
  const supportTypes = formValues(formData, "support_types");
  const availability = formValue(formData, "availability");
  const contactPreference = formValue(formData, "contact_preference");

  const partnerRequest = formBoolean(formData, "partner_request");
  const orgType = formValue(formData, "org_type");
  const orgName = formValue(formData, "org_name");

  const consentTerms = formBoolean(formData, "consent_terms");
  const consentAnalytics = formBoolean(formData, "consent_analytics");
  const consentAiTrainingAgg = formBoolean(formData, "consent_ai_training_agg");

  if (!firstName || !lastName || !phone) {
    return { error: "Etape 1 incomplete: renseignez prenom, nom et telephone." };
  }

  if (!regionId || !prefectureId || !communeId) {
    return { error: "Etape 2 incomplete: selectionnez region, prefecture et commune." };
  }

  if (!joinMode) {
    return { error: "Etape 3 incomplete: selectionnez le type d'inscription." };
  }

  if (!joinModes.has(joinMode)) {
    return { error: "Type d'inscription invalide." };
  }

  const cellulePrimary =
    cellulePrimaryInput ||
    (joinMode === "enterprise"
      ? "entrepreneur"
      : joinMode === "association"
        ? "org_leader"
        : "engaged");

  if (!celluleValues.has(cellulePrimary)) {
    return { error: "Cellule principale invalide." };
  }

  if (celluleSecondaryInput && !celluleValues.has(celluleSecondaryInput)) {
    return { error: "Cellule secondaire invalide." };
  }

  if (!birthDate && !ageRange) {
    return { error: "Date de naissance ou tranche d'age obligatoire." };
  }

  if (!educationLevel || !occupationStatus) {
    return { error: "Niveau d'education et statut professionnel obligatoires." };
  }

  if (!goalShortTerm) {
    return { error: "Objectif a 3-6 mois obligatoire." };
  }

  if (!contactPreferenceValues.has(contactPreference)) {
    return { error: "Preference de contact invalide." };
  }

  const skillsList = parseCsv(skillsText);
  if (skillsList.length === 0) {
    return { error: "Veuillez saisir au moins une competence." };
  }

  const interests = parseCsv(interestsText);
  if (interests.length === 0) {
    return { error: "Veuillez saisir au moins un centre d'interet." };
  }

  const oddPriorities = oddPrioritiesRaw
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isInteger(value));

  if (oddPriorities.length === 0) {
    return { error: "Selectionnez entre 1 et 3 ODD prioritaires." };
  }
  if (oddPriorities.length > 3) {
    return { error: "Maximum 3 ODD prioritaires." };
  }
  if (oddPriorities.some((value) => !allowedOdd.has(value))) {
    return { error: "ODD prioritaire invalide." };
  }

  if (supportTypes.length === 0) {
    return { error: "Veuillez selectionner au moins un type de support." };
  }

  if (!consentTerms) {
    return { error: "Vous devez accepter les conditions pour continuer." };
  }

  if (joinMode !== "personal" && !orgName) {
    return {
      error: "Le nom de l'association/entreprise est obligatoire pour ce type de profil.",
    };
  }

  if (partnerRequest && (!orgType || !orgTypes.has(orgType))) {
    return {
      error:
        "Le type organisation (association/entreprise) est obligatoire pour la demande partenaire.",
    };
  }

  if (partnerRequest && !orgName) {
    return {
      error: "Le nom de l'organisation est obligatoire pour la demande partenaire.",
    };
  }

  if (cellulePrimary === "engaged") {
    if (engagementDomains.length === 0 || !engagementFrequency || !engagementRecentAction) {
      return {
        error: "Pour le profil engage, domaines, frequence et action recente sont obligatoires.",
      };
    }
  }

  if (cellulePrimary === "entrepreneur") {
    if (!businessStage || !businessSector || businessNeeds.length === 0) {
      return {
        error: "Pour le profil entrepreneur, stade, secteur et besoins business sont obligatoires.",
      };
    }
  }

  if (cellulePrimary === "org_leader") {
    if (!orgRole || !orgNameDeclared) {
      return {
        error: "Pour le profil responsable organisation, role et nom declare sont obligatoires.",
      };
    }
  }

  try {
    await completeOnboarding({
      age_range: ageRange || undefined,
      availability: availability || undefined,
      birth_date: birthDate || undefined,
      business_needs: businessNeeds.length > 0 ? businessNeeds : undefined,
      business_sector: businessSector || undefined,
      business_stage: businessStage || undefined,
      cellule_primary: cellulePrimary as "engaged" | "entrepreneur" | "org_leader",
      cellule_secondary:
        celluleSecondaryInput && celluleValues.has(celluleSecondaryInput)
          ? (celluleSecondaryInput as "engaged" | "entrepreneur" | "org_leader")
          : undefined,
      commune_id: communeId,
      consent_ai_training_agg: consentAiTrainingAgg,
      consent_analytics: consentAnalytics,
      consent_terms: consentTerms,
      contact_preference: contactPreference as "whatsapp" | "email" | "call",
      education_level: educationLevel,
      email: email || null,
      engagement_domains: engagementDomains.length > 0 ? engagementDomains : undefined,
      engagement_frequency: engagementFrequency || undefined,
      engagement_recent_action: engagementRecentAction || undefined,
      first_name: firstName,
      gender: gender || undefined,
      goal_3_6_months: goalShortTerm,
      interests,
      join_mode: joinMode,
      last_name: lastName,
      locality: locality || undefined,
      mobility,
      mobility_zones: mobilityZones || undefined,
      odd_priorities: oddPriorities,
      occupation_status: occupationStatus,
      org_name: orgName || undefined,
      org_name_declared: orgNameDeclared || undefined,
      org_role: orgRole || undefined,
      org_type:
        orgType && orgTypes.has(orgType) ? (orgType as "association" | "enterprise") : undefined,
      partner_request: partnerRequest,
      phone,
      prefecture_id: prefectureId,
      profession_title: professionTitle || undefined,
      region_id: regionId,
      skills: skillsList.map((name) => ({ level: "intermediate", name })),
      support_types: supportTypes,
    });
  } catch (error) {
    return {
      error: normalizeOnboardingError(
        error instanceof Error ? error.message : "Impossible de finaliser l'onboarding.",
      ),
    };
  }

  revalidatePath("/app");
  redirect("/app/dashboard");
}
