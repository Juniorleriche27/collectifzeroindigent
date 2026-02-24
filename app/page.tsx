import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getLinkedMemberIdFromProfile } from "@/lib/supabase/member";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function paramValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function safeNextPath(value: string): string | null {
  const normalized = value.trim();
  if (!normalized.startsWith("/") || normalized.startsWith("//")) {
    return null;
  }
  return normalized;
}

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const code = paramValue(params.code);
  const nextPath = safeNextPath(paramValue(params.next));

  if (code) {
    const callbackParams = new URLSearchParams({ code });
    if (nextPath) {
      callbackParams.set("next", nextPath);
    }
    redirect(`/auth/callback?${callbackParams.toString()}`);
  }

  if (!isSupabaseConfigured) {
    redirect("/login");
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  let linkedMemberId: string | null = null;
  try {
    linkedMemberId = await getLinkedMemberIdFromProfile(user.id);
  } catch (error) {
    console.error("Unable to resolve linked member in root route", error);
  }

  if (!linkedMemberId) {
    redirect("/onboarding");
  }

  redirect("/app/dashboard");
}
