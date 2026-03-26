"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { marketingDisplayFont } from "@/components/marketing/fonts";

type PublicHeaderProps = {
  showAboutLink?: boolean;
};

const ff = "var(--font-marketing-display), sans-serif";

export function PublicHeader({ showAboutLink = true }: PublicHeaderProps) {
  const [open, setOpen] = useState(false);

  const navLinks = [
    { href: "/#accueil", label: "Accueil" },
    { href: "/#apropos", label: "À propos" },
    { href: "/#axes", label: "Axes" },
    { href: "/#galerie", label: "Galerie" },
    ...(showAboutLink ? [{ href: "/a-propos", label: "En savoir plus" }] : []),
  ];

  return (
    <header
      className={`${marketingDisplayFont.variable} fixed left-0 right-0 top-0 z-50 bg-white`}
      style={{
        borderBottom: "1px solid rgba(13,37,80,.07)",
        boxShadow: "0 2px 20px rgba(13,37,80,.07)",
      }}
    >
      {/* ── Main bar ──────────────────────────────── */}
      <div
        className="mx-auto flex h-[72px] w-full max-w-[1320px] items-center justify-between px-5 lg:px-14"
      >
        {/* Logo */}
        <Link className="flex items-center gap-3 no-underline" href="/" onClick={() => setOpen(false)}>
          <Image
            alt="Logo CZI"
            className="rounded-[10px] object-cover"
            height={42}
            src="/brand/czi-logo.jpeg"
            width={42}
          />
          <span className="flex flex-col leading-[1.25]">
            <span
              className="text-[0.88rem] font-extrabold tracking-[0.02em] text-[#0D2550]"
              style={{ fontFamily: ff }}
            >
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

        {/* Mobile hamburger */}
        <button
          className="relative z-10 flex h-10 w-10 flex-col items-center justify-center gap-[5px] rounded-xl transition-colors duration-200 hover:bg-[#F0F4FA] lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
        >
          <span
            className="block h-[2px] w-[22px] rounded-full bg-[#0D2550] transition-all duration-300"
            style={{ transform: open ? "translateY(7px) rotate(45deg)" : "none" }}
          />
          <span
            className="block h-[2px] w-[22px] rounded-full bg-[#0D2550] transition-all duration-200"
            style={{ opacity: open ? 0 : 1 }}
          />
          <span
            className="block h-[2px] w-[22px] rounded-full bg-[#0D2550] transition-all duration-300"
            style={{ transform: open ? "translateY(-7px) rotate(-45deg)" : "none" }}
          />
        </button>
      </div>

      {/* ── Mobile slide-down menu ─────────────────── */}
      <div
        className="absolute left-0 right-0 top-[72px] origin-top overflow-hidden lg:hidden"
        style={{
          background: "#fff",
          borderTop: "1px solid rgba(13,37,80,.07)",
          boxShadow: "0 12px 40px rgba(13,37,80,.12)",
          transition: "transform .28s cubic-bezier(.4,0,.2,1), opacity .22s ease",
          transform: open ? "scaleY(1)" : "scaleY(0)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      >
        <div className="flex flex-col px-5 pb-6 pt-4">
          {/* Nav links */}
          <nav className="mb-5 flex flex-col">
            {navLinks.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center py-[0.85rem] text-[0.83rem] font-semibold uppercase tracking-[0.07em] text-[#546180] no-underline transition-colors duration-150 hover:text-[#1A3F7A]"
                style={{
                  fontFamily: ff,
                  borderBottom: i < navLinks.length - 1 ? "1px solid rgba(13,37,80,.06)" : "none",
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* CTA buttons */}
          <div className="flex flex-col gap-3">
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center rounded-[8px] bg-[#1A3F7A] py-[0.85rem] text-[0.78rem] font-bold uppercase tracking-[0.07em] text-white no-underline transition-all duration-200 hover:bg-[#0D2550]"
              style={{ fontFamily: ff }}
            >
              Rejoindre le collectif ↗
            </Link>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center rounded-[8px] border-[1.5px] border-[#1A3F7A] py-[0.85rem] text-[0.78rem] font-bold uppercase tracking-[0.07em] text-[#1A3F7A] no-underline transition-all duration-200 hover:bg-[#1A3F7A] hover:text-white"
              style={{ fontFamily: ff }}
            >
              Connexion membre
            </Link>
          </div>
        </div>
      </div>

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
