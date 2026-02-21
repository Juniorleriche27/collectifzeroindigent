"use server";

import { revalidatePath } from "next/cache";

import { createOrganisation } from "@/lib/backend/api";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type OrganisationCreateState = {
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
  return "Impossible de creer cette organisation.";
}

export async function createOrganisationAction(
  _previousState: OrganisationCreateState,
  formData: FormData,
): Promise<OrganisationCreateState> {
  if (!isSupabaseConfigured) {
    return {
      error: "Supabase non configure.",
      success: null,
    };
  }

  const name = formValue(formData, "name");
  const type = formValue(formData, "type");

  if (!name) {
    return {
      error: "Le nom de l'organisation est obligatoire.",
      success: null,
    };
  }
  if (name.length < 3) {
    return {
      error: "Le nom de l'organisation doit contenir au moins 3 caracteres.",
      success: null,
    };
  }

  if (type !== "association" && type !== "enterprise") {
    return {
      error: "Type d'organisation invalide.",
      success: null,
    };
  }

  try {
    await createOrganisation({
      name,
      type,
    });
  } catch (error) {
    return {
      error: toErrorMessage(error),
      success: null,
    };
  }

  revalidatePath("/app/organisations");

  return {
    error: null,
    success: "Organisation creee.",
  };
}
