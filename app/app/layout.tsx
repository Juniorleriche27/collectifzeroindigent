import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Bell, Search } from "lucide-react";

import { AppSidebar } from "@/components/app/app-sidebar";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getCurrentUser } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getMemberForUser } from "@/lib/supabase/member";

export const dynamic = "force-dynamic";

export default async function MemberAppLayout({ children }: { children: ReactNode }) {
  let userEmail: string | undefined;
  let userInitials = "CZ";

  if (isSupabaseConfigured) {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    let linkedMemberId: string | null = null;
    try {
      linkedMemberId = (await getMemberForUser(user.id))?.id ?? null;
    } catch (error) {
      console.error("Unable to check linked member in app layout", error);
    }

    if (!linkedMemberId) redirect("/onboarding");

    userEmail = user.email;
    if (userEmail) {
      userInitials = userEmail.slice(0, 2).toUpperCase();
    }
  }

  return (
    <div className="h-screen overflow-hidden bg-background">
      <div className="flex h-full overflow-hidden">
        <AppSidebar />

        <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          {/* ── Header ── */}
          <header className="glass shrink-0 border-b border-border px-4 sm:px-6">
            <div className="flex h-16 items-center justify-between gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-xs sm:max-w-sm">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                  size={15}
                />
                <input
                  placeholder="Rechercher…"
                  className="h-9 w-full rounded-xl border border-border bg-background/60 pl-9 pr-3 text-sm text-foreground placeholder:text-muted outline-none transition-all focus:border-primary focus:bg-surface-elevated focus:ring-4 focus:ring-primary/15"
                />
              </div>

              {/* Right actions */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Notification bell */}
                <button
                  type="button"
                  aria-label="Notifications"
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background/60 text-muted transition-colors hover:bg-muted-surface hover:text-foreground"
                >
                  <Bell size={16} />
                  {/* Unread dot */}
                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
                </button>

                {/* User info */}
                <div className="flex items-center gap-2.5">
                  <div className="hidden text-right sm:block">
                    <p className="text-xs font-semibold text-foreground leading-none">Admin CZI</p>
                    <p className="mt-0.5 text-[11px] text-muted leading-none truncate max-w-[140px]">
                      {userEmail ?? "admin@czi.org"}
                    </p>
                  </div>
                  {/* Avatar */}
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-xs font-bold text-white shadow-sm">
                    {userInitials}
                  </div>
                </div>

                <SignOutButton />
              </div>
            </div>
          </header>

          {/* ── Main content ── */}
          <main className="flex-1 overflow-y-auto px-4 py-6 pb-24 sm:px-6 sm:py-8 lg:px-8 lg:pb-8">
            <div className="animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
