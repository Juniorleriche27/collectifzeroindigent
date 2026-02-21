"use server";

import { revalidatePath } from "next/cache";

import { updateMemberById } from "@/lib/backend/api";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type MemberUpdateState = {
  error: string | null;
  success: string | null;
};

const joinModes = new Set(["personal", "association", "enterprise"]);
const allowedStatuses = new Set(["active", "pending", "suspended"]);

function formValue(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Impossible de mettre a jour ce membre.";
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

  if (joinMode !== "personal" && !orgName) {
    return {
      error: "Le nom de l'organisation est requis pour ce type d'inscription.",
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
