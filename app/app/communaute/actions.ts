"use server";

import { revalidatePath } from "next/cache";

import { createConversation, postConversationMessage } from "@/lib/backend/api";
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
  const parentConversationId = formValue(formData, "parent_conversation_id");

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
    return { error: "Le titre est obligatoire pour une sous-communaute.", success: null };
  }

  if (!parentConversationId) {
    return { error: "Selectionnez une communaute de cellule.", success: null };
  }

  try {
    await createConversation({
      conversation_type: "community",
      parent_conversation_id: parentConversationId,
      title,
    });
  } catch (error) {
    return {
      error: toErrorMessage(error, "Impossible de creer la sous-communaute."),
      success: null,
    };
  }

  revalidatePath("/app/communaute");
  return { error: null, success: "Sous-communaute creee." };
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
