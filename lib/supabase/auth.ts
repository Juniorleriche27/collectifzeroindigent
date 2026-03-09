import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

const readCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Unable to read current user from Supabase session", error);
    return null;
  }

  return user;
});

const readCurrentAccessToken = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("Unable to read current Supabase session", error);
    return null;
  }

  return session?.access_token ?? null;
});

export async function getCurrentUser(): Promise<User | null> {
  return readCurrentUser();
}

export async function getCurrentAccessToken(): Promise<string | null> {
  return readCurrentAccessToken();
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
