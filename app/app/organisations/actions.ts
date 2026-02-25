"use server";

import { revalidatePath } from "next/cache";

import { createOrganisation, updateCurrentMember } from "@/lib/backend/api";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type OrganisationCreateState = {
  error: string | null;
  success: string | null;
};

export type PartnershipAttachState = {
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
  revalidatePath("/app/partenariat");

  return {
    error: null,
    success: "Partenaire cree.",
  };
}

export async function attachPartnershipAction(
  _previousState: PartnershipAttachState,
  formData: FormData,
): Promise<PartnershipAttachState> {
  if (!isSupabaseConfigured) {
    return {
      error: "Supabase non configure.",
      success: null,
    };
  }

  const mode = formValue(formData, "mode");
  const selectedName = formValue(formData, "organisation_name");
  const selectedId = formValue(formData, "organisation_id");
  const allowId = formValue(formData, "allow_id") === "1";

  if (mode !== "association" && mode !== "enterprise") {
    return {
      error: "Mode partenariat invalide.",
      success: null,
    };
  }

  if (!selectedName) {
    return {
      error: "Selectionnez un partenaire existant.",
      success: null,
    };
  }

  try {
    await updateCurrentMember({
      join_mode: mode,
      organisation_id: allowId ? selectedId || null : null,
      org_name: selectedName,
    });
  } catch (error) {
    return {
      error:
        error instanceof Error && error.message
          ? error.message
          : "Impossible d'ajouter ce partenariat.",
      success: null,
    };
  }

  revalidatePath("/app/organisations");
  revalidatePath("/app/partenariat");
  revalidatePath("/app/membres");

  return {
    error: null,
    success: "Partenariat ajoute a votre profil.",
  };
}
