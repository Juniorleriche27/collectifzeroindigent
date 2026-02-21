"use server";

import { revalidatePath } from "next/cache";

import { updateCurrentMember } from "@/lib/backend/api";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type SettingsState = {
  error: string | null;
  success: string | null;
};

function formValue(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Impossible de mettre a jour votre compte.";
}

export async function updateAccountSettings(
  _previousState: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
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

  if (!firstName || !lastName || !phone) {
    return {
      error: "Prenom, nom et telephone sont obligatoires.",
      success: null,
    };
  }

  try {
    await updateCurrentMember({
      email: email || null,
      first_name: firstName,
      last_name: lastName,
      phone,
    });
  } catch (error) {
    return {
      error: toErrorMessage(error),
      success: null,
    };
  }

  revalidatePath("/app/parametres");
  revalidatePath("/app/membres");

  return {
    error: null,
    success: "Informations mises a jour.",
  };
}
