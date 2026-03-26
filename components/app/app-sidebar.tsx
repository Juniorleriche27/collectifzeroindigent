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
  HandCoins,
  Mail,
  Megaphone,
  MessagesSquare,
  CreditCard,
  X,
  CircleHelp,
  CircleAlert,
  CircleUserRound,
  ArrowUpDown,
  LayoutGrid,
  MapPin,
  Settings,
  UsersRound,
  FolderOpen,
  FileText,
} from "lucide-react";

import { CziBrand } from "@/components/branding/czi-brand";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Principal",
    items: [
      { href: "/app/dashboard",  icon: LayoutGrid,      label: "Tableau de bord" },
      { href: "/app/membres",    icon: UsersRound,      label: "Membres" },
      { href: "/app/profils",    icon: CircleUserRound, label: "Profils" },
    ],
  },
  {
    label: "Contenus",
    items: [
      { href: "/app/projets",     icon: FolderOpen, label: "Projets" },
      { href: "/app/rapports",    icon: FileText,   label: "Rapports" },
      { href: "/app/communiques", icon: Megaphone,  label: "Communiqués" },
      { href: "/app/partenariat", icon: Handshake,  label: "Partenariat" },
      { href: "/app/a-propos",    icon: CircleAlert, label: "À propos" },
    ],
  },
  {
    label: "Communauté",
    items: [
      { href: "/app/communaute",      icon: MessagesSquare, label: "Communauté" },
      { href: "/app/campagnes-email", icon: Mail,           label: "Campagnes email" },
    ],
  },
  {
    label: "Gestion",
    items: [
      { href: "/app/communes-regions", icon: MapPin,     label: "Communes/Régions" },
      { href: "/app/import-export",    icon: ArrowUpDown, label: "Import/Export" },
      { href: "/app/parametres",       icon: Settings,    label: "Paramètres" },
    ],
  },
  {
    label: "Mon espace",
    items: [
      { href: "/app/carte-membre", icon: CreditCard,  label: "Carte membre" },
      { href: "/app/dons",         icon: HandCoins,   label: "Dons" },
      { href: "/app/support",      icon: CircleHelp,  label: "Assistance" },
    ],
  },
];

const allItems = navGroups.flatMap((g) => g.items);

function isActive(pathname: string, href: string) {
  if (href === "/app/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  item,
  active,
  collapsed,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={item.label}
      onClick={onClick}
      className={cn(
        "group relative flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
        collapsed ? "justify-center" : "gap-3",
        active
          ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary shadow-xs ring-1 ring-primary/15"
          : "text-muted hover:bg-muted-surface hover:text-foreground",
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
      )}
      <Icon
        size={17}
        className={cn(
          "shrink-0 transition-colors",
          active ? "text-primary" : "text-muted group-hover:text-foreground",
        )}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("czi.sidebar.collapsed") === "1";
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [mobileOpen]);

  function toggleSidebar() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem("czi.sidebar.collapsed", next ? "1" : "0");
      return next;
    });
  }

  const mobilePrimaryItems = ["/app/dashboard", "/app/membres", "/app/communaute", "/app/communiques", "/app/support"]
    .map((href) => allItems.find((i) => i.href === href))
    .filter((i): i is NavItem => Boolean(i));

  return (
    <>
      {/* ── Desktop Sidebar ───────────────────────── */}
      <aside
        className={cn(
          "hidden h-full shrink-0 flex-col border-r border-border bg-surface-elevated transition-all duration-200 lg:flex",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        {/* Brand header */}
        <div
          className={cn(
            "flex h-[64px] shrink-0 items-center border-b border-border",
            collapsed ? "justify-center px-3" : "justify-between px-4",
          )}
        >
          <CziBrand compact={collapsed} subtitle={!collapsed} />
          <button
            aria-label={collapsed ? "Agrandir" : "Réduire"}
            onClick={toggleSidebar}
            type="button"
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-muted-surface hover:text-foreground",
              collapsed && "hidden",
            )}
          >
            <ChevronLeft size={15} />
          </button>
          {collapsed && (
            <button
              aria-label="Agrandir"
              onClick={toggleSidebar}
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-muted-surface hover:text-foreground"
            >
              <ChevronRight size={15} />
            </button>
          )}
        </div>

        {/* Nav groups */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navGroups.map((group, gi) => (
            <div key={group.label} className={gi > 0 ? "mt-4" : ""}>
              {!collapsed && (
                <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted/60">
                  {group.label}
                </p>
              )}
              {collapsed && gi > 0 && (
                <div className="my-3 border-t border-border" />
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    active={isActive(pathname, item.href)}
                    collapsed={collapsed}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* ── Mobile ───────────────────────────────── */}
      <div className="lg:hidden">
        {/* Hamburger trigger */}
        <button
          aria-label="Ouvrir le menu"
          onClick={() => setMobileOpen(true)}
          type="button"
          className="fixed bottom-[72px] left-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-white shadow-lg transition-transform active:scale-95"
        >
          <Menu size={18} />
        </button>

        {/* Overlay + drawer */}
        <div className={cn("fixed inset-0 z-50 transition", mobileOpen ? "pointer-events-auto" : "pointer-events-none")}>
          <button
            aria-label="Fermer"
            className={cn(
              "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity",
              mobileOpen ? "opacity-100" : "opacity-0",
            )}
            onClick={() => setMobileOpen(false)}
            type="button"
          />
          <aside
            className={cn(
              "absolute inset-y-0 left-0 flex w-72 flex-col border-r border-border bg-surface-elevated shadow-xl transition-transform duration-300",
              mobileOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <div className="flex h-[64px] shrink-0 items-center justify-between border-b border-border px-4">
              <CziBrand subtitle />
              <button
                aria-label="Fermer"
                onClick={() => setMobileOpen(false)}
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-muted-surface"
              >
                <X size={16} />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
              {navGroups.map((group, gi) => (
                <div key={group.label} className={gi > 0 ? "mt-4" : ""}>
                  <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted/60">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.href}
                        item={item}
                        active={isActive(pathname, item.href)}
                        onClick={() => setMobileOpen(false)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </aside>
        </div>

        {/* Bottom tab bar */}
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface-elevated/95 backdrop-blur-lg">
          <div className="grid grid-cols-5">
            {mobilePrimaryItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-semibold transition-colors",
                    active ? "text-primary" : "text-muted",
                  )}
                >
                  <Icon size={18} />
                  <span className="truncate px-1">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
}
