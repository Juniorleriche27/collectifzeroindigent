import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getCurrentMember } from "@/lib/backend/api";
import { getCurrentUser } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  if (isSupabaseConfigured) {
    const user = await getCurrentUser();
    if (user) {
      let member = null;
      try {
        member = await getCurrentMember();
      } catch {
        redirect("/onboarding");
      }
      redirect(member ? "/app/dashboard" : "/onboarding");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#e4f1f8_0,_#f4f6f8_45%,_#f4f6f8_100%)] px-4 py-12">
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
