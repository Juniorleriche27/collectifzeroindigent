import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";

import { AppSidebar } from "@/components/app/app-sidebar";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Input } from "@/components/ui/input";
import { getCurrentUser } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getLinkedMemberIdFromProfile } from "@/lib/supabase/member";

export default async function MemberAppLayout({ children }: { children: ReactNode }) {
  let userEmail: string | undefined;

  if (isSupabaseConfigured) {
    const user = await getCurrentUser();
    if (!user) {
      redirect("/login");
    }

    let linkedMemberId: string | null = null;
    try {
      linkedMemberId = await getLinkedMemberIdFromProfile(user.id);
    } catch (error) {
      console.error("Unable to check linked member in app layout", error);
    }

    if (!linkedMemberId) {
      redirect("/onboarding");
    }
    userEmail = user.email;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <AppSidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <header className="border-b border-border bg-surface/95 px-6 backdrop-blur">
            <div className="flex h-20 items-center justify-between gap-4">
              <Input className="max-w-xl" placeholder="Rechercher..." />
              <div className="flex items-center gap-4">
                <button
                  className="rounded-full bg-muted-surface p-2 text-muted transition-colors hover:text-foreground"
                  type="button"
                >
                  <Bell size={18} />
                </button>
                <div className="hidden text-right md:block">
                  <p className="text-sm font-semibold text-foreground">Admin User</p>
                  <p className="text-xs text-muted">{userEmail ?? "admin@czi.fr"}</p>
                </div>
                <SignOutButton />
              </div>
            </div>
          </header>
          <main className="flex-1 px-6 py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
