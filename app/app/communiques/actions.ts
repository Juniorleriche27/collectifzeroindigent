"use server";

import { revalidatePath } from "next/cache";

import {
  createAnnouncement,
  deleteAnnouncement,
  updateAnnouncement,
  type ScopeLevel,
} from "@/lib/backend/api";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type CommuniqueCreateState = {
  error: string | null;
  success: string | null;
};

export type CommuniqueUpdateState = {
  error: string | null;
  success: string | null;
};

export type CommuniqueDeleteState = {
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

function parseScopeSelection(formData: FormData):
  | {
      error: string | null;
      scope: {
        commune_id: string | null;
        prefecture_id: string | null;
        region_id: string | null;
        scope_type: ScopeLevel;
      } | null;
    }
  | {
      error: string;
      scope: null;
    } {
  const scopeType = parseScopeType(formValue(formData, "scope_type"));
  const regionId = formValue(formData, "region_id");
  const prefectureId = formValue(formData, "prefecture_id");
  const communeId = formValue(formData, "commune_id");
  let effectiveScope: ScopeLevel = scopeType;

  if (communeId) {
    effectiveScope = "commune";
  } else if (prefectureId && (scopeType === "all" || scopeType === "region")) {
    effectiveScope = "prefecture";
  } else if (regionId && scopeType === "all") {
    effectiveScope = "region";
  }

  if (effectiveScope === "region" && !regionId) {
    return { error: "Selectionnez une region.", scope: null };
  }
  if (effectiveScope === "prefecture" && !prefectureId) {
    return { error: "Selectionnez une prefecture.", scope: null };
  }
  if (effectiveScope === "commune" && !communeId) {
    return { error: "Selectionnez une commune.", scope: null };
  }

  return {
    error: null,
    scope: {
      commune_id: effectiveScope === "commune" ? communeId : null,
      prefecture_id: effectiveScope === "prefecture" ? prefectureId : null,
      region_id: effectiveScope === "region" ? regionId : null,
      scope_type: effectiveScope,
    },
  };
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
  const publishNow = formValue(formData, "is_published") !== "false";
  const parsedScope = parseScopeSelection(formData);

  if (!title || !body) {
    return {
      error: "Le titre et le contenu sont obligatoires.",
      success: null,
    };
  }

  if (parsedScope.error || !parsedScope.scope) {
    return {
      error: parsedScope.error ?? "Portee invalide.",
      success: null,
    };
  }

  try {
    await createAnnouncement({
      body,
      is_published: publishNow,
      scopes: [parsedScope.scope],
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

export async function updateCommuniqueAction(
  _previousState: CommuniqueUpdateState,
  formData: FormData,
): Promise<CommuniqueUpdateState> {
  if (!isSupabaseConfigured) {
    return {
      error: "Supabase non configure.",
      success: null,
    };
  }

  const announcementId = formValue(formData, "announcement_id");
  const title = formValue(formData, "title");
  const body = formValue(formData, "body");
  const publishNow = formValue(formData, "is_published") !== "false";
  const parsedScope = parseScopeSelection(formData);

  if (!announcementId) {
    return {
      error: "Identifiant du communique manquant.",
      success: null,
    };
  }
  if (!title || !body) {
    return {
      error: "Le titre et le contenu sont obligatoires.",
      success: null,
    };
  }
  if (parsedScope.error || !parsedScope.scope) {
    return {
      error: parsedScope.error ?? "Portee invalide.",
      success: null,
    };
  }

  try {
    await updateAnnouncement(announcementId, {
      body,
      is_published: publishNow,
      scopes: [parsedScope.scope],
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
    success: "Communique mis a jour.",
  };
}

export async function deleteCommuniqueAction(
  _previousState: CommuniqueDeleteState,
  formData: FormData,
): Promise<CommuniqueDeleteState> {
  if (!isSupabaseConfigured) {
    return {
      error: "Supabase non configure.",
      success: null,
    };
  }

  const announcementId = formValue(formData, "announcement_id");
  if (!announcementId) {
    return {
      error: "Identifiant du communique manquant.",
      success: null,
    };
  }

  try {
    const result = await deleteAnnouncement(announcementId);
    revalidatePath("/app/communiques");
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
