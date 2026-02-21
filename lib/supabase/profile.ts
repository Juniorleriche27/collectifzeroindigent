import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

type ProfileLookupResult = {
  error: PostgrestError | null;
  memberId: string | null;
};

type ProfileRoleLookupResult = {
  error: PostgrestError | null;
  role: string | null;
};

function isMissingUserIdColumn(error: PostgrestError | null): boolean {
  if (!error) return false;
  return error.code === "42703" && /user_id/i.test(error.message);
}

export async function getProfileMemberIdByAuthUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfileLookupResult> {
  const byUserId = await supabase
    .from("profile")
    .select("member_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!isMissingUserIdColumn(byUserId.error)) {
    return { error: byUserId.error, memberId: byUserId.data?.member_id ?? null };
  }

  const byId = await supabase
    .from("profile")
    .select("member_id")
    .eq("id", userId)
    .maybeSingle();

  return { error: byId.error, memberId: byId.data?.member_id ?? null };
}

export async function updateProfileMemberIdByAuthUser(
  supabase: SupabaseClient,
  userId: string,
  memberId: string,
): Promise<PostgrestError | null> {
  const updateByUserId = await supabase
    .from("profile")
    .update({ member_id: memberId })
    .eq("user_id", userId);

  if (!isMissingUserIdColumn(updateByUserId.error)) {
    return updateByUserId.error;
  }

  const updateById = await supabase
    .from("profile")
    .update({ member_id: memberId })
    .eq("id", userId);

  return updateById.error;
}

export async function getProfileRoleByAuthUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfileRoleLookupResult> {
  const byUserId = await supabase
    .from("profile")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (!isMissingUserIdColumn(byUserId.error)) {
    return { error: byUserId.error, role: byUserId.data?.role ?? null };
  }

  const byId = await supabase
    .from("profile")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return { error: byId.error, role: byId.data?.role ?? null };
}
