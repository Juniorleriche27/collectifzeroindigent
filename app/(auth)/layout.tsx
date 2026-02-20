import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#e4f1f8_0,_#f4f6f8_45%,_#f4f6f8_100%)] px-4 py-12">
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
