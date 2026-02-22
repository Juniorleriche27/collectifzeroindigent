"use server";

import { revalidatePath } from "next/cache";

import { updateMemberById } from "@/lib/backend/api";
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

const joinModes = new Set(["personal", "association", "enterprise"]);
const allowedStatuses = new Set(["active", "pending"]);
const allowedRoles = new Set(["member", "pf", "cn", "ca", "admin"]);

function formValue(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Impossible de mettre a jour ce membre.";
}

function toRoleErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const candidate = error as { code?: string; message?: string };
    if (candidate.code === "42501") {
      return (
        "Permission RLS insuffisante pour modifier le role. " +
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
  return "Impossible de mettre a jour le role.";
}

export async function updateMember(
  memberId: string,
  _previousState: MemberUpdateState,
  formData: FormData,
): Promise<MemberUpdateState> {
  if (!isSupabaseConfigured) {
    return {
      error: "Supabase non configure.",
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
      error: "Tous les champs obligatoires doivent etre renseignes.",
      success: null,
    };
  }

  if (!allowedStatuses.has(status)) {
    return { error: "Status invalide.", success: null };
  }

  if (!joinModes.has(joinMode)) {
    return { error: "Type d'inscription invalide.", success: null };
  }

  if (joinMode !== "personal" && !orgName && !organisationId) {
    return {
      error:
        "Selectionnez une organisation existante ou renseignez un nouveau nom d'organisation.",
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
    success: "Membre mis a jour.",
  };
}

export async function updateMemberRole(
  memberId: string,
  targetUserId: string,
  _previousState: MemberRoleState,
  formData: FormData,
): Promise<MemberRoleState> {
  if (!isSupabaseConfigured) {
    return { error: "Supabase non configure.", success: null };
  }

  const nextRole = formValue(formData, "role").toLowerCase();
  if (!allowedRoles.has(nextRole)) {
    return { error: "Role invalide.", success: null };
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
    return { error: "Seuls les roles admin/ca peuvent modifier un role.", success: null };
  }

  if (actorRole === "ca" && (nextRole === "ca" || nextRole === "admin")) {
    return {
      error: "Le role CA peut attribuer uniquement member/pf/cn.",
      success: null,
    };
  }

  if (targetUserId === user.id && nextRole !== actorRole && actorRole === "ca") {
    return {
      error: "Un role CA ne peut pas modifier son propre role.",
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
        "Role non modifie. Verifiez les policies profile puis reappliquez `sql/2026-02-22_profile_role_governance_access.sql`.",
      success: null,
    };
  }

  revalidatePath("/app/membres");
  revalidatePath(`/app/membres/${memberId}`);
  revalidatePath("/app/profils");
  revalidatePath("/app/parametres");

  return {
    error: null,
    success: `Role mis a jour: ${nextRole}.`,
  };
}
