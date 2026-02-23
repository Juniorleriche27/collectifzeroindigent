"use server";

import { revalidatePath } from "next/cache";

import { createConversation, postConversationMessage, type ScopeLevel } from "@/lib/backend/api";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type ConversationActionState = {
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

function parseScopeType(value: string): ScopeLevel {
  if (value === "region" || value === "prefecture" || value === "commune") {
    return value;
  }
  return "all";
}

export async function createConversationAction(
  _previousState: ConversationActionState,
  formData: FormData,
): Promise<ConversationActionState> {
  if (!isSupabaseConfigured) {
    return { error: "Supabase non configure.", success: null };
  }

  const conversationType = formValue(formData, "conversation_type");
  const title = formValue(formData, "title");
  const participantMemberId = formValue(formData, "participant_member_id");
  const scopeType = parseScopeType(formValue(formData, "scope_type"));
  const regionId = formValue(formData, "region_id");
  const prefectureId = formValue(formData, "prefecture_id");
  const communeId = formValue(formData, "commune_id");

  if (conversationType !== "community" && conversationType !== "direct") {
    return { error: "Type de conversation invalide.", success: null };
  }

  if (conversationType === "direct") {
    if (!participantMemberId) {
      return { error: "Selectionnez un membre pour le message prive.", success: null };
    }
    try {
      await createConversation({
        conversation_type: "direct",
        participant_member_ids: [participantMemberId],
        title: title || undefined,
      });
    } catch (error) {
      return {
        error: toErrorMessage(error, "Impossible de creer la conversation privee."),
        success: null,
      };
    }

    revalidatePath("/app/communaute");
    return { error: null, success: "Conversation privee creee." };
  }

  if (!title) {
    return { error: "Le titre est obligatoire pour un canal communaute.", success: null };
  }

  if (scopeType === "region" && !regionId) {
    return { error: "Selectionnez une region.", success: null };
  }
  if (scopeType === "prefecture" && !prefectureId) {
    return { error: "Selectionnez une prefecture.", success: null };
  }
  if (scopeType === "commune" && !communeId) {
    return { error: "Selectionnez une commune.", success: null };
  }

  try {
    await createConversation({
      commune_id: scopeType === "commune" ? communeId : undefined,
      conversation_type: "community",
      prefecture_id: scopeType === "prefecture" ? prefectureId : undefined,
      region_id: scopeType === "region" ? regionId : undefined,
      scope_type: scopeType,
      title,
    });
  } catch (error) {
    return {
      error: toErrorMessage(error, "Impossible de creer le canal communaute."),
      success: null,
    };
  }

  revalidatePath("/app/communaute");
  return { error: null, success: "Canal communaute cree." };
}

export async function postConversationMessageAction(
  _previousState: ConversationActionState,
  formData: FormData,
): Promise<ConversationActionState> {
  if (!isSupabaseConfigured) {
    return { error: "Supabase non configure.", success: null };
  }

  const conversationId = formValue(formData, "conversation_id");
  const body = formValue(formData, "body");

  if (!conversationId || !body) {
    return { error: "Conversation et message sont obligatoires.", success: null };
  }

  try {
    await postConversationMessage(conversationId, { body });
  } catch (error) {
    return {
      error: toErrorMessage(error, "Impossible d'envoyer ce message."),
      success: null,
    };
  }

  revalidatePath("/app/communaute");
  revalidatePath(`/app/communaute?conversation=${conversationId}`);
  return { error: null, success: "Message envoye." };
}
