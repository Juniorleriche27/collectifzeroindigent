"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  Handshake,
  Mail,
  Megaphone,
  MessagesSquare,
  X,
  CircleHelp,
  CircleAlert,
  CircleUserRound,
  ArrowUpDown,
  LayoutGrid,
  MapPin,
  Settings,
  UsersRound,
} from "lucide-react";

import { CziBrand } from "@/components/branding/czi-brand";
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
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const previousOverflow = document.body.style.overflow;
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  function toggleSidebar() {
    setCollapsed((previous) => {
      const next = !previous;
      window.localStorage.setItem("czi.sidebar.collapsed", next ? "1" : "0");
      return next;
    });
  }

  const mobilePrimaryItems = [
    navItems[0],
    navItems[1],
    navItems[6],
    navItems[5],
    navItems[11],
  ];

  return (
    <>
      <aside
        className={cn(
          "hidden h-full shrink-0 border-r border-border bg-surface transition-all duration-200 lg:block",
          collapsed ? "w-24" : "w-72",
        )}
      >
        <div className="flex h-full flex-col overflow-hidden">
          <div
            className={cn(
              "flex h-20 items-center border-b border-border",
              collapsed ? "justify-between px-3" : "justify-between px-6",
            )}
          >
            <CziBrand compact={collapsed} subtitle={!collapsed} />
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
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
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
        </div>
      </aside>

      <div className="lg:hidden">
        <Button
          aria-label="Ouvrir le menu"
          className="fixed bottom-20 left-4 z-40 h-11 w-11 rounded-full bg-foreground p-0 text-white shadow-lg hover:bg-foreground/90"
          onClick={() => setMobileOpen(true)}
          type="button"
          variant="ghost"
        >
          <Menu size={18} />
        </Button>

        <div
          className={cn(
            "fixed inset-0 z-50 transition",
            mobileOpen ? "pointer-events-auto" : "pointer-events-none",
          )}
        >
          <button
            aria-label="Fermer le menu"
            className={cn(
              "absolute inset-0 bg-black/45 transition-opacity",
              mobileOpen ? "opacity-100" : "opacity-0",
            )}
            onClick={() => setMobileOpen(false)}
            type="button"
          />
          <aside
            className={cn(
              "absolute inset-y-0 left-0 flex w-[84vw] max-w-xs flex-col border-r border-border bg-surface shadow-xl transition-transform",
              mobileOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <CziBrand subtitle={false} />
              <Button
                aria-label="Fermer le menu"
                onClick={() => setMobileOpen(false)}
                size="sm"
                type="button"
                variant="ghost"
              >
                <X size={18} />
              </Button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
              {navItems.map((item) => {
                const ItemIcon = item.icon;
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={`mobile-${item.href}`}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
                      active
                        ? "bg-primary/15 text-primary ring-1 ring-primary/20"
                        : "text-muted hover:bg-muted-surface hover:text-foreground",
                    )}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    title={item.label}
                  >
                    <ItemIcon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>

        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur">
          <div className="grid grid-cols-5">
            {mobilePrimaryItems.map((item) => {
              const ItemIcon = item.icon;
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={`mobile-bar-${item.href}`}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-semibold",
                    active ? "text-primary" : "text-muted",
                  )}
                  href={item.href}
                  title={item.label}
                >
                  <ItemIcon size={17} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
}
