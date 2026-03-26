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
          <header className="shrink-0 border-b border-[#E2E8F0] bg-white px-4 sm:px-6" style={{ boxShadow: "0 2px 8px rgba(18,32,46,.05)" }}>
            <div className="flex h-16 items-center justify-between gap-4">
              {/* Search — hidden on mobile */}
              <div className="relative hidden flex-1 max-w-xs sm:block sm:max-w-sm">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8CA0]"
                  size={15}
                />
                <input
                  placeholder="Rechercher…"
                  className="h-9 w-full rounded-xl border border-[#E2E8F0] bg-[#F0F3F8] pl-9 pr-3 text-sm text-[#12202E] placeholder:text-[#7A8CA0] outline-none transition-all focus:border-[#1A8A9B] focus:ring-4 focus:ring-[#1A8A9B]/15"
                />
              </div>

              {/* Mobile brand — visible only on small screens */}
              <div className="flex items-center gap-2 sm:hidden">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[0.6rem] font-extrabold text-white"
                  style={{ background: "#0D2550", fontFamily: "'Syne', sans-serif" }}
                >
                  CZI
                </div>
                <span className="text-[0.8rem] font-extrabold text-[#0D2550]" style={{ fontFamily: "'Syne', sans-serif" }}>
                  Tableau de bord
                </span>
              </div>

              {/* Right actions */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Notification bell */}
                <button
                  type="button"
                  aria-label="Notifications"
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#E2E8F0] bg-[#F0F3F8] text-[#7A8CA0] transition-colors hover:bg-[#E0F4F7] hover:text-[#12202E]"
                >
                  <Bell size={16} />
                  {/* Unread dot */}
                  <span className="absolute right-[8px] top-[8px] h-2 w-2 rounded-full border-2 border-white bg-[#E53935]" />
                </button>

                {/* User chip */}
                <div
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#E2E9F4] bg-[#F0F3F8] py-1 pl-1 pr-3 transition-colors hover:bg-[#E8F2FF]"
                >
                  {/* Avatar */}
                  <div className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-gradient-to-br from-[#1A8A9B] to-[#0F5F6B] text-[0.6rem] font-extrabold text-white">
                    {userInitials}
                  </div>
                  <div className="hidden text-left sm:block">
                    <p className="text-[0.72rem] font-bold leading-none text-[#12202E]" style={{ fontFamily: "'Syne', sans-serif" }}>Admin CZI</p>
                    <p className="mt-0.5 max-w-[120px] truncate text-[11px] leading-none text-[#7A8CA0]">
                      {userEmail ?? "admin@czi.org"}
                    </p>
                  </div>
                </div>

                <SignOutButton />
              </div>
            </div>
          </header>

          {/* ── Main content ── */}
          <main className="flex-1 overflow-y-auto px-4 py-6 pb-[88px] sm:px-6 sm:py-8 lg:px-8 lg:pb-8">
            <div className="animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
