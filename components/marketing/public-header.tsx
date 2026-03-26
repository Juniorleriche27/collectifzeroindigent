"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Home, Info, Grid2x2, UserPlus } from "lucide-react";

import { marketingDisplayFont } from "@/components/marketing/fonts";

type PublicHeaderProps = {
  showAboutLink?: boolean;
};

const ff = "var(--font-marketing-display), sans-serif";

const bottomTabs = [
  { id: "accueil",  href: "/#accueil",  label: "Accueil",  Icon: Home },
  { id: "apropos",  href: "/#apropos",  label: "À propos", Icon: Info },
  { id: "axes",     href: "/#axes",     label: "Axes",     Icon: Grid2x2 },
  { id: "rejoindre",href: "/signup",    label: "Rejoindre",Icon: UserPlus, badge: true },
];

export function PublicHeader({ showAboutLink = true }: PublicHeaderProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("accueil");

  const navLinks = [
    { href: "/#accueil", label: "Accueil" },
    { href: "/#apropos", label: "À propos" },
    { href: "/#axes",    label: "Axes" },
    { href: "/#galerie", label: "Galerie" },
    ...(showAboutLink ? [{ href: "/a-propos", label: "En savoir plus" }] : []),
  ];

  const overlayLinks: ({ href: string; label: string; on?: boolean } | null)[] = [
    { href: "/#accueil",           label: "🏠  Accueil",            on: true },
    { href: "/#apropos",           label: "ℹ️  À propos" },
    { href: "/#axes",              label: "📋  Axes stratégiques" },
    { href: "/#galerie",           label: "🖼️  Galerie" },
    null,
    { href: "/login",              label: "🔐  Connexion" },
    { href: "/app/dashboard",      label: "📱  Plateforme membres" },
  ];

  return (
    <header
      className={`${marketingDisplayFont.variable} fixed left-0 right-0 top-0 z-50 bg-white`}
      style={{ borderBottom: "1px solid rgba(13,37,80,.07)", boxShadow: "0 2px 20px rgba(13,37,80,.07)" }}
    >
      {/* ── Main bar ──────────────────────────────── */}
      <div className="mx-auto flex h-[64px] w-full max-w-[1320px] items-center justify-between px-5 lg:px-14">
        {/* Logo */}
        <Link className="flex items-center gap-3 no-underline" href="/" onClick={() => setOpen(false)}>
          <Image alt="Logo CZI" className="rounded-[10px] object-cover" height={42} src="/brand/czi-logo.jpeg" width={42} />
          <span className="flex flex-col leading-[1.25]">
            <span className="text-[0.88rem] font-extrabold tracking-[0.02em] text-[#0D2550]" style={{ fontFamily: ff }}>
              CZI
            </span>
            <span className="hidden text-[0.65rem] tracking-[0.05em] text-[#546180] sm:block">
              Collectif Zéro Indigent
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-[2.2rem] lg:flex">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="nav-link relative text-[0.76rem] font-semibold uppercase tracking-[0.08em] text-[#546180] no-underline transition-colors duration-200 hover:text-[#1A3F7A]"
              style={{ fontFamily: ff }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            className="rounded-[6px] border-[1.5px] border-[#1A3F7A] bg-transparent px-[1.4rem] py-[0.6rem] text-[0.74rem] font-bold uppercase tracking-[0.07em] text-[#1A3F7A] no-underline transition-all duration-200 hover:bg-[#1A3F7A] hover:text-white"
            style={{ fontFamily: ff }}
          >
            Connexion
          </Link>
          <Link
            href="/signup"
            className="rounded-[6px] bg-[#1A3F7A] px-[1.4rem] py-[0.6rem] text-[0.74rem] font-bold uppercase tracking-[0.07em] text-white no-underline transition-all duration-200 hover:bg-[#0D2550]"
            style={{ fontFamily: ff }}
          >
            Rejoindre ↗
          </Link>
        </div>

        {/* Mobile: ghost menu + solid CTA */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-[8px] border-[1.5px] border-[#1A3F7A] px-3 py-[6px] text-[0.7rem] font-bold uppercase tracking-[0.04em] text-[#1A3F7A] transition-colors active:bg-[#1A3F7A]/10"
            style={{ fontFamily: ff }}
            aria-label="Ouvrir le menu"
          >
            ☰
          </button>
          <Link
            href="/signup"
            className="rounded-[8px] bg-[#1A3F7A] px-3 py-[7px] text-[0.7rem] font-bold uppercase tracking-[0.04em] text-white no-underline transition-colors hover:bg-[#0D2550]"
            style={{ fontFamily: ff }}
          >
            Rejoindre
          </Link>
        </div>
      </div>

      {/* ── Full-screen overlay menu (mobile) ─────── */}
      <div
        className="fixed inset-0 z-[200] flex flex-col lg:hidden"
        style={{
          background: "#0D2550",
          transform: open ? "translateX(0)" : "translateX(105%)",
          transition: "transform .32s cubic-bezier(.4,0,.2,1)",
        }}
        aria-hidden={!open}
      >
        {/* Overlay header */}
        <div className="flex items-center justify-between px-[22px] pb-7 pt-[22px]">
          <div className="flex items-center gap-[7px]">
            <Image alt="CZI" src="/brand/czi-logo.jpeg" width={30} height={30} className="rounded-[7px] object-cover" />
            <div>
              <span className="block text-[0.82rem] font-extrabold text-white" style={{ fontFamily: ff }}>CZI</span>
              <span className="block text-[0.58rem] text-white/45" style={{ fontFamily: ff }}>Collectif Zéro Indigent</span>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] text-base text-white transition-colors active:bg-white/20"
            style={{ background: "rgba(255,255,255,.1)" }}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Links */}
        <div className="flex flex-col gap-[3px] px-[22px]">
          {overlayLinks.map((item, i) =>
            item === null ? (
              <div key={i} className="my-2 h-px" style={{ background: "rgba(255,255,255,.1)" }} />
            ) : (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-[11px] px-[14px] py-[13px] text-[0.85rem] font-semibold no-underline transition-all duration-150"
                style={{
                  fontFamily: ff,
                  color: item.on ? "#fff" : "rgba(255,255,255,.65)",
                  background: item.on ? "rgba(255,255,255,.1)" : "transparent",
                }}
              >
                {item.label}
              </Link>
            )
          )}
        </div>

        {/* CTA buttons at bottom */}
        <div className="mt-auto flex flex-col gap-[9px] px-[22px] pb-[28px]">
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center rounded-[10px] border py-[12px] text-[0.74rem] font-bold uppercase tracking-[0.06em] no-underline transition-colors hover:bg-white/5"
            style={{ borderColor: "rgba(255,255,255,.2)", color: "rgba(255,255,255,.72)", fontFamily: ff }}
          >
            Connexion
          </Link>
          <Link
            href="/signup"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center rounded-[10px] py-[13px] text-[0.76rem] font-extrabold uppercase tracking-[0.06em] text-[#0D2550] no-underline transition-all hover:brightness-110"
            style={{ background: "#E8A820", fontFamily: ff }}
          >
            Rejoindre le collectif ↗
          </Link>
        </div>
      </div>

      {/* ── Bottom nav — mobile only ─────────────── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-[100] grid grid-cols-4 bg-white lg:hidden"
        style={{
          borderTop: "1px solid #E2E8F0",
          boxShadow: "0 -4px 20px rgba(0,0,0,.07)",
          paddingBottom: "max(8px, env(safe-area-inset-bottom))",
        }}
      >
        {bottomTabs.map(({ id, href, label, Icon, badge }) => {
          const active = activeTab === id;
          return (
            <Link
              key={id}
              href={href}
              onClick={() => setActiveTab(id)}
              className="relative flex flex-col items-center gap-[3px] py-[8px] no-underline transition-colors"
              style={{ color: active ? "#1A3F7A" : "#7A8CA0" }}
            >
              {active && (
                <span
                  className="absolute left-1/2 top-0 -translate-x-1/2 rounded-b-[3px]"
                  style={{ width: 20, height: 3, background: "#1A3F7A" }}
                />
              )}
              <span className="relative">
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                {badge && (
                  <span
                    className="absolute -right-[9px] -top-[4px] h-[7px] w-[7px] rounded-full border-2 border-white"
                    style={{ background: "#E53935" }}
                  />
                )}
              </span>
              <span
                className="text-[0.56rem] font-bold uppercase tracking-[0.04em]"
                style={{ fontFamily: ff }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      <style>{`
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -4px; left: 0; right: 0;
          height: 2px;
          background: #1A3F7A;
          border-radius: 1px;
          transform: scaleX(0);
          transition: transform 0.2s;
        }
        .nav-link:hover::after { transform: scaleX(1); }
      `}</style>
    </header>
  );
}
