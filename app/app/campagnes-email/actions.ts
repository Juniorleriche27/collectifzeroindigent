"use server";

import { revalidatePath } from "next/cache";

import {
  createEmailCampaign,
  queueEmailCampaign,
  sendEmailCampaign,
  type ScopeLevel,
} from "@/lib/backend/api";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type EmailCampaignActionState = {
  error: string | null;
  success: string | null;
};

function formValue(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function parseScopeType(value: string): ScopeLevel {
  if (value === "region" || value === "prefecture" || value === "commune") {
    return value;
  }
  return "all";
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export async function createEmailCampaignAction(
  _previousState: EmailCampaignActionState,
  formData: FormData,
): Promise<EmailCampaignActionState> {
  if (!isSupabaseConfigured) {
    return { error: "Supabase non configure.", success: null };
  }

  const subject = formValue(formData, "subject");
  const body = formValue(formData, "body");
  const audienceScope = parseScopeType(formValue(formData, "audience_scope"));
  const regionId = formValue(formData, "region_id");
  const prefectureId = formValue(formData, "prefecture_id");
  const communeId = formValue(formData, "commune_id");
  const provider = formValue(formData, "provider");
  let effectiveScope: ScopeLevel = audienceScope;

  if (communeId) {
    effectiveScope = "commune";
  } else if (prefectureId && (audienceScope === "all" || audienceScope === "region")) {
    effectiveScope = "prefecture";
  } else if (regionId && audienceScope === "all") {
    effectiveScope = "region";
  }

  if (!subject || !body) {
    return {
      error: "Le sujet et le contenu du mail sont obligatoires.",
      success: null,
    };
  }

  if (effectiveScope === "region" && !regionId) {
    return { error: "Selectionnez une region cible.", success: null };
  }
  if (effectiveScope === "prefecture" && !prefectureId) {
    return { error: "Selectionnez une prefecture cible.", success: null };
  }
  if (effectiveScope === "commune" && !communeId) {
    return { error: "Selectionnez une commune cible.", success: null };
  }

  try {
    await createEmailCampaign({
      audience_scope: effectiveScope,
      body,
      commune_id: effectiveScope === "commune" ? communeId : undefined,
      prefecture_id: effectiveScope === "prefecture" ? prefectureId : undefined,
      provider: provider || undefined,
      region_id: effectiveScope === "region" ? regionId : undefined,
      subject,
    });
  } catch (error) {
    return {
      error: toErrorMessage(error, "Impossible de creer la campagne email."),
      success: null,
    };
  }

  revalidatePath("/app/campagnes-email");
  return { error: null, success: "Campagne creee en brouillon." };
}

export async function queueEmailCampaignAction(formData: FormData): Promise<void> {
  if (!isSupabaseConfigured) {
    return;
  }

  const campaignId = formValue(formData, "campaign_id");
  if (!campaignId) {
    return;
  }

  try {
    await queueEmailCampaign(campaignId);
  } catch (error) {
    console.error("Unable to queue email campaign", error);
  }

  revalidatePath("/app/campagnes-email");
}

export async function sendEmailCampaignAction(formData: FormData): Promise<void> {
  if (!isSupabaseConfigured) {
    return;
  }

  const campaignId = formValue(formData, "campaign_id");
  if (!campaignId) {
    return;
  }

  try {
    await sendEmailCampaign(campaignId);
  } catch (error) {
    console.error("Unable to send email campaign", error);
  }

  revalidatePath("/app/campagnes-email");
}
