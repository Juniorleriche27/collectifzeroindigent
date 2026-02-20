"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { completeOnboarding, getCurrentMember } from "@/lib/backend/api";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type OnboardingState = {
  error: string | null;
};

const initialState: OnboardingState = {
  error: null,
};

export { initialState };

const joinModes = new Set(["personal", "association", "enterprise"]);

function formValue(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Impossible de creer le membre pour le moment.";
}

export async function submitOnboarding(
  _previousState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  if (!isSupabaseConfigured) {
    return {
      error: "Supabase non configure. Ajoutez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  try {
    const existingMember = await getCurrentMember();
    if (existingMember) {
      redirect("/app/dashboard");
    }
  } catch (error) {
    return {
      error: toErrorMessage(error),
    };
  }

  const firstName = formValue(formData, "first_name");
  const lastName = formValue(formData, "last_name");
  const phone = formValue(formData, "phone");
  const email = formValue(formData, "email");
  const regionId = formValue(formData, "region_id");
  const prefectureId = formValue(formData, "prefecture_id");
  const communeId = formValue(formData, "commune_id");
  const joinMode = formValue(formData, "join_mode");
  const orgName = formValue(formData, "org_name");

  if (
    !firstName ||
    !lastName ||
    !phone ||
    !regionId ||
    !prefectureId ||
    !communeId ||
    !joinMode
  ) {
    return { error: "Tous les champs obligatoires doivent etre renseignes." };
  }

  if (!joinModes.has(joinMode)) {
    return { error: "Type d'inscription invalide." };
  }

  if (joinMode !== "personal" && !orgName) {
    return { error: "Le nom de l'organisation est requis pour ce type d'inscription." };
  }

  try {
    await completeOnboarding({
      commune_id: communeId,
      email: email || undefined,
      first_name: firstName,
      join_mode: joinMode,
      last_name: lastName,
      org_name: joinMode === "personal" ? undefined : orgName,
      phone,
      prefecture_id: prefectureId,
      region_id: regionId,
    });
  } catch (error) {
    return {
      error: toErrorMessage(error),
    };
  }

  revalidatePath("/app");
  redirect("/app/dashboard");
}
