import Image from "next/image";
import Link from "next/link";

import { marketingDisplayFont } from "@/components/marketing/fonts";

type PublicHeaderProps = {
  showAboutLink?: boolean;
};

export function PublicHeader({ showAboutLink = true }: PublicHeaderProps) {
  return (
    <header
      className={`${marketingDisplayFont.variable} fixed left-0 right-0 top-0 z-50 border-b border-black/[0.07] bg-white shadow-[0_2px_20px_rgba(13,37,80,0.07)]`}
      style={{ height: 72 }}
    >
      <div className="mx-auto flex h-full w-full max-w-[1320px] items-center justify-between gap-4 px-6 lg:px-14">
        {/* Logo */}
        <Link className="flex items-center gap-3 no-underline" href="/">
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
              style={{ fontFamily: "var(--font-marketing-display), sans-serif" }}
            >
              CZI
            </span>
            <span className="text-[0.65rem] tracking-[0.05em] text-[#546180]">
              Collectif Zéro Indigent
            </span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden items-center gap-[2.2rem] lg:flex">
          {[
            { href: "/#accueil", label: "Accueil" },
            { href: "/#apropos", label: "À propos" },
            { href: "/#axes", label: "Axes" },
            { href: "/#galerie", label: "Galerie" },
            ...(showAboutLink ? [{ href: "/a-propos", label: "En savoir plus" }] : []),
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="nav-link relative text-[0.76rem] font-semibold uppercase tracking-[0.08em] text-[#546180] no-underline transition-colors duration-200 hover:text-[#1A3F7A]"
              style={{ fontFamily: "var(--font-marketing-display), sans-serif" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-[6px] border-[1.5px] border-[#1A3F7A] bg-transparent px-[1.4rem] py-[0.6rem] text-[0.74rem] font-bold uppercase tracking-[0.07em] text-[#1A3F7A] no-underline transition-all duration-200 hover:bg-[#1A3F7A] hover:text-white"
            style={{ fontFamily: "var(--font-marketing-display), sans-serif" }}
          >
            Connexion
          </Link>
          <Link
            href="/signup"
            className="rounded-[6px] bg-[#1A3F7A] px-[1.4rem] py-[0.6rem] text-[0.74rem] font-bold uppercase tracking-[0.07em] text-white no-underline transition-all duration-200 hover:bg-[#0D2550]"
            style={{ fontFamily: "var(--font-marketing-display), sans-serif" }}
          >
            Rejoindre ↗
          </Link>
        </div>
      </div>

      <style>{`
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          right: 0;
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
