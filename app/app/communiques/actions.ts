"use server";

import { revalidatePath } from "next/cache";

import { createAnnouncement, type ScopeLevel } from "@/lib/backend/api";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type CommuniqueCreateState = {
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
  return "Impossible de publier ce communique.";
}

function parseScopeType(value: string): ScopeLevel {
  if (value === "region" || value === "prefecture" || value === "commune") {
    return value;
  }
  return "all";
}

export async function createCommuniqueAction(
  _previousState: CommuniqueCreateState,
  formData: FormData,
): Promise<CommuniqueCreateState> {
  if (!isSupabaseConfigured) {
    return {
      error: "Supabase non configure.",
      success: null,
    };
  }

  const title = formValue(formData, "title");
  const body = formValue(formData, "body");
  const scopeType = parseScopeType(formValue(formData, "scope_type"));
  const regionId = formValue(formData, "region_id");
  const prefectureId = formValue(formData, "prefecture_id");
  const communeId = formValue(formData, "commune_id");
  const publishNow = formValue(formData, "is_published") !== "false";
  let effectiveScope: ScopeLevel = scopeType;

  if (communeId) {
    effectiveScope = "commune";
  } else if (prefectureId && (scopeType === "all" || scopeType === "region")) {
    effectiveScope = "prefecture";
  } else if (regionId && scopeType === "all") {
    effectiveScope = "region";
  }

  if (!title || !body) {
    return {
      error: "Le titre et le contenu sont obligatoires.",
      success: null,
    };
  }

  if (effectiveScope === "region" && !regionId) {
    return {
      error: "Selectionnez une region.",
      success: null,
    };
  }
  if (effectiveScope === "prefecture" && !prefectureId) {
    return {
      error: "Selectionnez une prefecture.",
      success: null,
    };
  }
  if (effectiveScope === "commune" && !communeId) {
    return {
      error: "Selectionnez une commune.",
      success: null,
    };
  }

  try {
    await createAnnouncement({
      body,
      is_published: publishNow,
      scopes: [
        {
          commune_id: effectiveScope === "commune" ? communeId : null,
          prefecture_id: effectiveScope === "prefecture" ? prefectureId : null,
          region_id: effectiveScope === "region" ? regionId : null,
          scope_type: effectiveScope,
        },
      ],
      title,
    });
  } catch (error) {
    return {
      error: toErrorMessage(error),
      success: null,
    };
  }

  revalidatePath("/app/communiques");

  return {
    error: null,
    success: "Communique publie avec succes.",
  };
}
