import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getProfileMemberIdByAuthUser } from "@/lib/supabase/profile";

function safeNextPath(value: string | null): string | null {
  const normalized = (value ?? "").trim();
  if (!normalized.startsWith("/") || normalized.startsWith("//")) {
    return null;
  }
  return normalized;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const preferredNext = safeNextPath(requestUrl.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/login", requestUrl.origin));
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    console.error("Auth callback exchange failed", exchangeError);
    return NextResponse.redirect(new URL("/login", requestUrl.origin));
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Auth callback user fetch failed", userError);
    return NextResponse.redirect(new URL("/login", requestUrl.origin));
  }

  const profileLookup = await getProfileMemberIdByAuthUser(supabase, user.id);
  if (profileLookup.error) {
    console.error("Auth callback profile/member lookup failed", profileLookup.error);
  }

  const fallbackTarget = profileLookup.memberId ? "/app/dashboard" : "/onboarding";
  return NextResponse.redirect(new URL(preferredNext ?? fallbackTarget, requestUrl.origin));
}
