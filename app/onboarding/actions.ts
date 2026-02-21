"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getLinkedMemberIdFromProfile } from "@/lib/supabase/member";
import { updateProfileMemberIdByAuthUser } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";

export type OnboardingState = {
  error: string | null;
};

const joinModes = new Set(["personal", "association", "enterprise"]);

function formValue(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function normalizeOnboardingError(message: string): string {
  if (/infinite recursion detected in policy.*member/i.test(message)) {
    return (
      "Erreur RLS sur la table member (policy recursive). " +
      "Appliquez le script SQL `sql/2026-02-21_fix_member_profile_rls.sql` dans Supabase, puis reessayez."
    );
  }
  return message;
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

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Session invalide. Reconnectez-vous." };
  }

  let linkedMemberId: string | null = null;
  try {
    linkedMemberId = await getLinkedMemberIdFromProfile(user.id);
  } catch (error) {
    // Keep onboarding usable even if membership check fails due policy misconfiguration.
    console.error("Unable to check linked member before onboarding submit", error);
  }
  if (linkedMemberId) {
    redirect("/app/dashboard");
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

  const { data: member, error: memberError } = await supabase
    .from("member")
    .insert({
      user_id: user.id,
      first_name: firstName,
      last_name: lastName,
      phone,
      email: email || null,
      region_id: regionId,
      prefecture_id: prefectureId,
      commune_id: communeId,
      join_mode: joinMode,
      org_name: joinMode === "personal" ? null : orgName,
    })
    .select("id")
    .single();

  if (memberError || !member) {
    return {
      error: normalizeOnboardingError(
        memberError?.message ?? "Impossible de creer le membre pour le moment.",
      ),
    };
  }

  const profileError = await updateProfileMemberIdByAuthUser(supabase, user.id, member.id);

  if (profileError) {
    return {
      error: profileError.message,
    };
  }

  revalidatePath("/app");
  redirect("/app/dashboard");
}
