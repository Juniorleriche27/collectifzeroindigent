"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type MemberUpdateState = {
  error: string | null;
  success: string | null;
};

export const initialMemberUpdateState: MemberUpdateState = {
  error: null,
  success: null,
};

const joinModes = new Set(["personal", "association", "enterprise"]);
const allowedStatuses = new Set(["active", "pending", "suspended"]);

function formValue(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "Session invalide. Reconnectez-vous.",
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

  const { error } = await supabase
    .from("member")
    .update({
      first_name: firstName,
      last_name: lastName,
      phone,
      email: email || null,
      status,
      region_id: regionId,
      prefecture_id: prefectureId,
      commune_id: communeId,
      join_mode: joinMode,
      org_name: joinMode === "personal" ? null : orgName,
    })
    .eq("id", memberId);

  if (error) {
    return {
      error: error.message,
      success: null,
    };
  }

  revalidatePath("/app/members");
  revalidatePath(`/app/members/${memberId}`);

  return {
    error: null,
    success: "Membre mis a jour.",
  };
}
