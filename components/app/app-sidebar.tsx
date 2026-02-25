"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ChevronLeft,
  ChevronRight,
  Handshake,
  Mail,
  Megaphone,
  MessagesSquare,
  CircleHelp,
  CircleAlert,
  CircleUserRound,
  ArrowUpDown,
  LayoutGrid,
  MapPin,
  Settings,
  UsersRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
  { href: "/app/partenariat", icon: Handshake, label: "Partenariat" },
  { href: "/app/a-propos", icon: CircleAlert, label: "A propos" },
  { href: "/app/communiques", icon: Megaphone, label: "Communiques" },
  { href: "/app/communaute", icon: MessagesSquare, label: "Communaute" },
  { href: "/app/campagnes-email", icon: Mail, label: "Campagnes email" },
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
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("czi.sidebar.collapsed") === "1";
  });

  function toggleSidebar() {
    setCollapsed((previous) => {
      const next = !previous;
      window.localStorage.setItem("czi.sidebar.collapsed", next ? "1" : "0");
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 border-r border-border bg-surface transition-all duration-200 lg:block",
        collapsed ? "w-24" : "w-72",
      )}
    >
      <div className={cn("flex h-20 items-center border-b border-border", collapsed ? "justify-center px-2" : "justify-between px-6")}>
        <p className={cn("font-bold tracking-tight text-foreground", collapsed ? "text-xl" : "text-2xl")}>
          {collapsed ? "CZ" : "CZI"}
        </p>
        <Button
          aria-label={collapsed ? "Agrandir le menu" : "Reduire le menu"}
          onClick={toggleSidebar}
          size="sm"
          type="button"
          variant="ghost"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </Button>
      </div>
      <nav className="space-y-1 px-3 py-6">
        {navItems.map((item) => {
          const ItemIcon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              className={cn(
                "flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
                collapsed ? "justify-center gap-0 px-2" : "gap-3",
                active
                  ? "bg-primary/15 text-primary ring-1 ring-primary/20"
                  : "text-muted hover:bg-muted-surface hover:text-foreground",
              )}
              href={item.href}
              title={item.label}
            >
              <ItemIcon size={20} />
              {!collapsed ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
