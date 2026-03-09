import "server-only";

import { cache } from "react";

import { getCurrentUser } from "@/lib/supabase/auth";
import { getProfileRoleByAuthUser } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";

const readCurrentProfileRole = cache(async (): Promise<string | null> => {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const supabase = await createClient();
  const { error, role } = await getProfileRoleByAuthUser(supabase, user.id);
  if (error) {
    throw error;
  }

  return role;
});

const readProfileRoleByAuthUserId = cache(async (userId: string): Promise<string | null> => {
  const supabase = await createClient();
  const { error, role } = await getProfileRoleByAuthUser(supabase, userId);
  if (error) {
    throw error;
  }

  return role;
});

export async function getCurrentProfileRole(): Promise<string | null> {
  return readCurrentProfileRole();
}

export async function getProfileRoleByAuthUserId(userId: string): Promise<string | null> {
  return readProfileRoleByAuthUserId(userId);
}
