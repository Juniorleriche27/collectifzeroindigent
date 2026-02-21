import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";

function isProtectedRoute(pathname: string) {
  return pathname === "/onboarding" || pathname.startsWith("/app");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isSupabaseConfigured) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request,
  });

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("Unable to resolve user in middleware", userError);
    }

    if (!user && isProtectedRoute(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    if (user) {
      let hasMember = false;

      if (pathname === "/onboarding" || pathname.startsWith("/app")) {
        const { data: profile, error: profileError } = await supabase
          .from("profile")
          .select("member_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Unable to read profile.member_id in middleware", profileError);
        } else {
          hasMember = Boolean(profile?.member_id);
        }
      }

      if (!hasMember && pathname.startsWith("/app")) {
        const url = request.nextUrl.clone();
        url.pathname = "/onboarding";
        return NextResponse.redirect(url);
      }

      if (hasMember && pathname === "/onboarding") {
        const url = request.nextUrl.clone();
        url.pathname = "/app/dashboard";
        return NextResponse.redirect(url);
      }
    }

    return response;
  } catch (error) {
    console.error("Unexpected middleware proxy failure", error);
    if (isProtectedRoute(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return response;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
