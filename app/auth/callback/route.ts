import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { getProfileMemberIdByAuthUser } from "@/lib/supabase/profile";

function safeNextPath(value: string | null): string | null {
  const normalized = (value ?? "").trim();
  if (!normalized.startsWith("/") || normalized.startsWith("//")) {
    return null;
  }
  return normalized;
}

function parseEmailOtpType(value: string | null): EmailOtpType | null {
  if (
    value === "signup" ||
    value === "invite" ||
    value === "magiclink" ||
    value === "recovery" ||
    value === "email_change" ||
    value === "email"
  ) {
    return value;
  }
  return null;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const otpType = parseEmailOtpType(requestUrl.searchParams.get("type"));
  const preferredNext = safeNextPath(requestUrl.searchParams.get("next"));

  const supabase = await createClient();

  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      console.error("Auth callback exchange failed", exchangeError);
      return NextResponse.redirect(new URL("/login", requestUrl.origin));
    }
  } else if (tokenHash && otpType) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType,
    });
    if (verifyError) {
      console.error("Auth callback OTP verification failed", verifyError);
      return NextResponse.redirect(new URL("/login", requestUrl.origin));
    }
  } else {
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

  const fallbackTarget =
    otpType === "recovery"
      ? "/reset-password"
      : profileLookup.memberId
        ? "/app/dashboard"
        : "/onboarding";
  const target = preferredNext ?? fallbackTarget;

  return NextResponse.redirect(new URL(target, requestUrl.origin));
}
