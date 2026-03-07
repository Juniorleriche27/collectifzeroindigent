"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getMemberForUser } from "@/lib/supabase/member";

function formValue(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function formBoolean(formData: FormData, key: string): boolean {
  const value = String(formData.get(key) ?? "")
    .trim()
    .toLowerCase();
  return value === "on" || value === "true" || value === "1";
}

function buildRedirect(path: string, kind: "error" | "notice", message: string): never {
  const params = new URLSearchParams();
  params.set(kind, message);
  redirect(`${path}?${params.toString()}`);
}

export async function saveMemberCardRequestAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    buildRedirect("/app/carte-membre", "error", "Session invalide. Reconnectez-vous.");
  }

  const linkedMember = await getMemberForUser(user.id);
  if (!linkedMember?.id) {
    buildRedirect(
      "/app/carte-membre",
      "error",
      "Completer d'abord l'onboarding avant de demander une carte membre.",
    );
  }

  const requestId = formValue(formData, "request_id");
  const requested = formBoolean(formData, "requested");
  const photoUrl = formValue(formData, "photo_url");
  const deliveryMode = formValue(formData, "delivery_mode") === "delivery" ? "delivery" : "pickup";
  const deliveryContact = formValue(formData, "delivery_contact");
  const deliveryAddress = formValue(formData, "delivery_address");

  const { error: memberUpdateError } = await supabase
    .from("member")
    .update({
      photo_status: photoUrl ? "uploaded" : "missing",
      photo_url: photoUrl || null,
    })
    .eq("id", linkedMember.id);

  if (memberUpdateError) {
    buildRedirect("/app/carte-membre", "error", memberUpdateError.message);
  }

  const payload = {
    delivery_address: deliveryAddress || null,
    delivery_contact: deliveryContact || null,
    delivery_mode: deliveryMode,
    requested,
  };

  if (requestId) {
    const { error } = await supabase
      .from("member_card_request")
      .update(payload)
      .eq("id", requestId);

    if (error) {
      buildRedirect("/app/carte-membre", "error", error.message);
    }
  } else {
    const { error } = await supabase.from("member_card_request").insert({
      ...payload,
      member_id: linkedMember.id,
    });

    if (error) {
      buildRedirect("/app/carte-membre", "error", error.message);
    }
  }

  revalidatePath("/app/carte-membre");
  revalidatePath("/app/dashboard");
  buildRedirect(
    "/app/carte-membre",
    "notice",
    requested
      ? "Demande de carte enregistree. Les informations de livraison et la photo ont ete mises a jour."
      : "Preference carte enregistree.",
  );
}
