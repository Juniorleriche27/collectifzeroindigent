"use server";

import { revalidatePath } from "next/cache";

import { askSupportAi } from "@/lib/backend/api";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type SupportAskState = {
  error: string | null;
  success: string | null;
};

function formValue(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export async function askSupportAiAction(
  _previousState: SupportAskState,
  formData: FormData,
): Promise<SupportAskState> {
  if (!isSupabaseConfigured) {
    return { error: "Supabase non configure.", success: null };
  }

  const question = formValue(formData, "question");
  if (!question) {
    return { error: "Saisissez votre question.", success: null };
  }

  try {
    await askSupportAi(question);
  } catch (error) {
    return {
      error: toErrorMessage(error, "Erreur support IA."),
      success: null,
    };
  }

  revalidatePath("/app/support");
  return { error: null, success: "Reponse IA enregistree." };
}

