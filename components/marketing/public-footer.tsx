import Image from "next/image";
import Link from "next/link";

import { marketingDisplayFont } from "@/components/marketing/fonts";

export function PublicFooter() {
  return (
    <footer
      className={`${marketingDisplayFont.variable} border-t border-white/[0.06] bg-[#0D1829]`}
    >
      <div className="mx-auto flex w-full max-w-[1320px] flex-col items-start justify-between gap-4 px-6 py-[2.4rem] sm:flex-row sm:items-center lg:px-14">
        {/* Logo + name */}
        <Link href="/" className="flex items-center gap-3 no-underline">
          <Image
            alt="CZI"
            className="rounded-[7px] object-cover"
            height={32}
            src="/brand/czi-logo.jpeg"
            width={32}
          />
          <span
            className="text-[0.8rem] font-bold tracking-[0.03em] text-white/50"
            style={{ fontFamily: "var(--font-marketing-display), sans-serif" }}
          >
            Collectif Zéro Indigent
          </span>
        </Link>

        {/* Links */}
        <ul className="flex list-none flex-wrap gap-x-6 gap-y-2 sm:gap-x-8">
          {[
            { href: "/#accueil", label: "Accueil" },
            { href: "/#apropos", label: "À propos" },
            { href: "/login", label: "Connexion" },
            { href: "/signup", label: "Inscription" },
          ].map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-white/[0.27] no-underline transition-colors duration-200 hover:text-[#F5C84A]"
                style={{ fontFamily: "var(--font-marketing-display), sans-serif" }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Copyright */}
        <p className="text-[0.74rem] text-white/20">
          © {new Date().getFullYear()} CZI · Jeunes entrepreneurs, promoteurs des ODD.
        </p>
      </div>
    </footer>
  );
}
