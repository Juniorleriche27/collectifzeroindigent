import Link from "next/link";
import type { ReactNode } from "react";

const navItems = [
  { href: "/app/dashboard", label: "Dashboard" },
  { href: "/app/members", label: "Membres" },
  { href: "/app/profile", label: "Mon profil" },
];

export default function MemberAppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">CZI</p>
            <h1 className="text-sm font-semibold text-foreground">Espace membre</h1>
          </div>
          <nav className="flex items-center gap-1 rounded-lg bg-muted-surface p-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
