"use server";

import { revalidatePath } from "next/cache";

import {
  generateMemberOnboardingAnalysis,
  updateMemberById,
  validateMemberById,
} from "@/lib/backend/api";
import { OWNER_ADMIN_EMAIL } from "@/lib/constants/governance";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  getProfileRoleByAuthUser,
  updateProfileRoleByAuthUser,
} from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";

export type MemberUpdateState = {
  error: string | null;
  success: string | null;
};

export type MemberRoleState = {
  error: string | null;
  success: string | null;
};

export type MemberValidationState = {
  error: string | null;
  success: string | null;
};

export type MemberOnboardingAnalysisState = {
  analysis: string | null;
  error: string | null;
  generatedAt: string | null;
  model: string | null;
};

const joinModes = new Set(["personal", "association", "enterprise"]);
const allowedStatuses = new Set(["active", "pending", "rejected", "suspended"]);
const allowedValidationDecisions = new Set(["approve", "reject"]);
const allowedCellules = new Set(["engaged", "entrepreneur", "org_leader"]);
const allowedRoles = new Set(["member", "pf", "cn", "ca", "admin"]);

function formValue(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Impossible de mettre à jour ce membre.";
}

function toRoleErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const candidate = error as { code?: string; message?: string };
    if (candidate.code === "42501") {
      return (
        "Permission RLS insuffisante pour modifier le rôle. " +
        "Appliquez le script SQL `sql/2026-02-22_profile_role_governance_access.sql`."
      );
    }
    if (typeof candidate.message === "string" && candidate.message.trim()) {
      return candidate.message.trim();
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Impossible de mettre à jour le rôle.";
}

export async function updateMember(
  memberId: string,
  _previousState: MemberUpdateState,
  formData: FormData,
): Promise<MemberUpdateState> {
  if (!isSupabaseConfigured) {
    return {
      error: "Supabase non configuré.",
      success: null,
    };
  }

  const firstName = formValue(formData, "first_name");
  const lastName = formValue(formData, "last_name");
  const phone = formValue(formData, "phone");
  const email = formValue(formData, "email");
  const status = formValue(formData, "status");
  const regionId = formValue(formData, "region_id");
  const prefectureId = formValue(formData, "prefecture_id");
  const communeId = formValue(formData, "commune_id");
  const joinMode = formValue(formData, "join_mode");
  const organisationId = formValue(formData, "organisation_id");
  const orgName = formValue(formData, "org_name");

  if (
    !firstName ||
    !lastName ||
    !phone ||
    !status ||
    !regionId ||
    !prefectureId ||
    !communeId ||
    !joinMode
  ) {
    return {
      error: "Tous les champs obligatoires doivent être renseignés.",
      success: null,
    };
  }

  if (!allowedStatuses.has(status)) {
    return { error: "Statut invalide.", success: null };
  }

  if (!joinModes.has(joinMode)) {
    return { error: "Type d'inscription invalide.", success: null };
  }

  if (joinMode !== "personal" && !orgName && !organisationId) {
    return {
      error:
        "Sélectionnez une organisation existante ou renseignez un nouveau nom d'organisation.",
      success: null,
    };
  }

  try {
    await updateMemberById(memberId, {
      commune_id: communeId,
      email: email || null,
      first_name: firstName,
      join_mode: joinMode,
      last_name: lastName,
      organisation_id: joinMode === "personal" ? null : organisationId || null,
      org_name: joinMode === "personal" ? null : orgName,
      phone,
      prefecture_id: prefectureId,
      region_id: regionId,
      status,
    });
  } catch (error) {
    return {
      error: toErrorMessage(error),
      success: null,
    };
  }

  revalidatePath("/app/membres");
  revalidatePath(`/app/membres/${memberId}`);

  return {
    error: null,
    success: "Membre mis à jour.",
  };
}

export async function updateMemberRole(
  memberId: string,
  targetUserId: string,
  targetEmail: string | null,
  _previousState: MemberRoleState,
  formData: FormData,
): Promise<MemberRoleState> {
  if (!isSupabaseConfigured) {
    return { error: "Supabase non configuré.", success: null };
  }

  const nextRole = formValue(formData, "role").toLowerCase();
  if (!allowedRoles.has(nextRole)) {
    return { error: "Rôle invalide.", success: null };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Session invalide. Reconnectez-vous.", success: null };
  }

  const actorRoleLookup = await getProfileRoleByAuthUser(supabase, user.id);
  if (actorRoleLookup.error) {
    return { error: toRoleErrorMessage(actorRoleLookup.error), success: null };
  }
  const actorRole = (actorRoleLookup.role ?? "member").toLowerCase();

  if (actorRole !== "admin" && actorRole !== "ca") {
    return { error: "Seuls les rôles admin/ca peuvent modifier un rôle.", success: null };
  }

  if (actorRole === "ca" && (nextRole === "ca" || nextRole === "admin")) {
    return {
      error: "Le rôle CA peut attribuer uniquement member/pf/cn.",
      success: null,
    };
  }

  if (targetUserId === user.id && nextRole !== actorRole && actorRole === "ca") {
    return {
      error: "Un rôle CA ne peut pas modifier son propre rôle.",
      success: null,
    };
  }

  const normalizedTargetEmail = (targetEmail ?? "").trim().toLowerCase();
  if (normalizedTargetEmail === OWNER_ADMIN_EMAIL && nextRole !== "admin") {
    return {
      error: `Le compte propriétaire ${OWNER_ADMIN_EMAIL} doit conserver le rôle admin.`,
      success: null,
    };
  }

  const updateResult = await updateProfileRoleByAuthUser(supabase, targetUserId, nextRole);
  if (updateResult.error) {
    return { error: toRoleErrorMessage(updateResult.error), success: null };
  }

  const verification = await getProfileRoleByAuthUser(supabase, targetUserId);
  if (verification.error) {
    return { error: toRoleErrorMessage(verification.error), success: null };
  }
  if (verification.role?.toLowerCase() !== nextRole) {
    return {
      error:
        "Rôle non modifié. Vérifiez les policies profile puis réappliquez `sql/2026-02-22_profile_role_governance_access.sql`.",
      success: null,
    };
  }

  revalidatePath("/app/membres");
  revalidatePath(`/app/membres/${memberId}`);
  revalidatePath("/app/profils");
  revalidatePath("/app/parametres");

  return {
    error: null,
    success: `Rôle mis à jour : ${nextRole}.`,
  };
}

export async function requestMemberOnboardingAnalysis(
  memberId: string,
  _previousState: MemberOnboardingAnalysisState,
): Promise<MemberOnboardingAnalysisState> {
  void _previousState;

  if (!isSupabaseConfigured) {
    return {
      analysis: null,
      error: "Supabase non configurÃ©.",
      generatedAt: null,
      model: null,
    };
  }

  try {
    const result = await generateMemberOnboardingAnalysis(memberId);

    return {
      analysis: result.analysis,
      error: null,
      generatedAt: result.generated_at,
      model: result.model,
    };
  } catch (error) {
    return {
      analysis: null,
      error:
        error instanceof Error && error.message
          ? error.message
          : "Impossible de generer l'analyse IA de cette fiche.",
      generatedAt: null,
      model: null,
    };
  }
}

export async function validateMember(
  memberId: string,
  _previousState: MemberValidationState,
  formData: FormData,
): Promise<MemberValidationState> {
  if (!isSupabaseConfigured) {
    return { error: "Supabase non configuré.", success: null };
  }

  const decision = formValue(formData, "decision").toLowerCase();
  const cellulePrimary = formValue(formData, "cellule_primary");
  const celluleSecondaryRaw = formValue(formData, "cellule_secondary");
  const reason = formValue(formData, "reason");

  if (!allowedValidationDecisions.has(decision)) {
    return { error: "Décision de validation invalide.", success: null };
  }

  if (!allowedCellules.has(cellulePrimary)) {
    return { error: "Cellule primaire invalide.", success: null };
  }

  if (celluleSecondaryRaw && !allowedCellules.has(celluleSecondaryRaw)) {
    return { error: "Cellule secondaire invalide.", success: null };
  }

  if (celluleSecondaryRaw && celluleSecondaryRaw === cellulePrimary) {
    return {
      error: "La cellule secondaire doit être différente de la cellule primaire.",
      success: null,
    };
  }

  if (decision === "reject" && !reason) {
    return { error: "Le motif est obligatoire pour un rejet.", success: null };
  }

  try {
    const result = await validateMemberById(memberId, {
      cellule_primary: cellulePrimary as "engaged" | "entrepreneur" | "org_leader",
      cellule_secondary: celluleSecondaryRaw
        ? (celluleSecondaryRaw as "engaged" | "entrepreneur" | "org_leader")
        : null,
      decision: decision as "approve" | "reject",
      reason: reason || undefined,
    });

    revalidatePath("/app/membres");
    revalidatePath(`/app/membres/${memberId}`);

    return {
      error: null,
      success: result.message,
    };
  } catch (error) {
    return {
      error: toErrorMessage(error),
      success: null,
    };
  }
}
