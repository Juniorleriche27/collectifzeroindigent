"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CircleHelp,
  CircleUserRound,
  ArrowUpDown,
  LayoutGrid,
  MapPin,
  Settings,
  UsersRound,
} from "lucide-react";

import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

const navItems: NavItem[] = [
  { href: "/app/dashboard", icon: LayoutGrid, label: "Tableau de bord" },
  { href: "/app/membres", icon: UsersRound, label: "Membres" },
  { href: "/app/profils", icon: CircleUserRound, label: "Profils" },
  { href: "/app/organisations", icon: Building2, label: "Organisations" },
  { href: "/app/communes-regions", icon: MapPin, label: "Communes/Regions" },
  { href: "/app/import-export", icon: ArrowUpDown, label: "Import/Export" },
  { href: "/app/parametres", icon: Settings, label: "Parametres" },
  { href: "/app/support", icon: CircleHelp, label: "Support" },
];

function isActive(pathname: string, href: string) {
  if (href === "/app/dashboard") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-border bg-surface lg:block">
      <div className="flex h-20 items-center justify-between border-b border-border px-6">
        <p className="text-2xl font-bold tracking-tight text-foreground">CZI</p>
      </div>
      <nav className="space-y-1 px-3 py-6">
        {navItems.map((item) => {
          const ItemIcon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
                active
                  ? "bg-foreground text-background"
                  : "text-muted hover:bg-muted-surface hover:text-foreground",
              )}
              href={item.href}
            >
              <ItemIcon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
