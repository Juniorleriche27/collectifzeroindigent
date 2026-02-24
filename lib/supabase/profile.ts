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

async function lookupMemberIdByUserId(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfileLookupResult> {
  const memberLookup = await supabase
    .from("member")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (memberLookup.error) {
    return { error: memberLookup.error, memberId: null };
  }

  return { error: null, memberId: memberLookup.data?.id ?? null };
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
    if (byUserId.error) {
      return { error: byUserId.error, memberId: null };
    }
    if (byUserId.data?.member_id) {
      return { error: null, memberId: byUserId.data.member_id };
    }

    const byIdFallback = await supabase
      .from("profile")
      .select("member_id")
      .eq("id", userId)
      .maybeSingle();

    if (byIdFallback.error) {
      return { error: byIdFallback.error, memberId: null };
    }
    if (byIdFallback.data?.member_id) {
      return { error: null, memberId: byIdFallback.data.member_id };
    }

    return lookupMemberIdByUserId(supabase, userId);
  }

  const byId = await supabase
    .from("profile")
    .select("member_id")
    .eq("id", userId)
    .maybeSingle();

  if (byId.error) {
    return { error: byId.error, memberId: null };
  }
  if (byId.data?.member_id) {
    return { error: null, memberId: byId.data.member_id };
  }
  return lookupMemberIdByUserId(supabase, userId);
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
    if (updateByUserId.error) {
      return updateByUserId.error;
    }

    const verifyByUserId = await supabase
      .from("profile")
      .select("member_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (verifyByUserId.error) {
      return verifyByUserId.error;
    }
    if (verifyByUserId.data) {
      return null;
    }

    const updateByIdFallback = await supabase
      .from("profile")
      .update({ member_id: memberId })
      .eq("id", userId);
    return updateByIdFallback.error;
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
    if (byUserId.error) {
      return { error: byUserId.error, role: null };
    }
    if (byUserId.data?.role) {
      return { error: null, role: byUserId.data.role };
    }

    const byIdFallback = await supabase
      .from("profile")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    return { error: byIdFallback.error, role: byIdFallback.data?.role ?? null };
  }

  const byId = await supabase
    .from("profile")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return { error: byId.error, role: byId.data?.role ?? null };
}

export async function updateProfileRoleByAuthUser(
  supabase: SupabaseClient,
  userId: string,
  role: string,
): Promise<ProfileRoleLookupResult> {
  const updateByUserId = await supabase
    .from("profile")
    .update({ role })
    .eq("user_id", userId)
    .select("role")
    .maybeSingle();

  if (!isMissingUserIdColumn(updateByUserId.error)) {
    if (updateByUserId.error) {
      return { error: updateByUserId.error, role: null };
    }
    if (updateByUserId.data?.role) {
      return { error: null, role: updateByUserId.data.role };
    }

    const updateByIdFallback = await supabase
      .from("profile")
      .update({ role })
      .eq("id", userId)
      .select("role")
      .maybeSingle();
    return { error: updateByIdFallback.error, role: updateByIdFallback.data?.role ?? null };
  }

  const updateById = await supabase
    .from("profile")
    .update({ role })
    .eq("id", userId)
    .select("role")
    .maybeSingle();

  return { error: updateById.error, role: updateById.data?.role ?? null };
}
