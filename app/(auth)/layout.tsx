import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

import {
  marketingDisplayFont,
  marketingSerifFont,
  marketingBodyFont,
} from "@/components/marketing/fonts";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const ff = {
    display: "var(--font-marketing-display), sans-serif",
    serif:   "var(--font-marketing-serif), Georgia, serif",
    body:    "var(--font-marketing-body), sans-serif",
  };

  return (
    <div
      className={`${marketingDisplayFont.variable} ${marketingSerifFont.variable} ${marketingBodyFont.variable} flex min-h-screen`}
    >
      {/* ── Panneau gauche — bleu foncé ─────────── */}
      <div
        className="relative hidden overflow-hidden lg:flex lg:w-[44%] lg:flex-col lg:justify-between"
        style={{ background: "#0D2550", padding: "3rem 3.5rem" }}
      >
        {/* SVG grille géométrique */}
        <svg
          className="pointer-events-none absolute inset-0"
          viewBox="0 0 600 900"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="agrid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <line x1="60" y1="0" x2="0" y2="60" stroke="rgba(232,168,32,.05)" strokeWidth="1" />
              <rect x="27" y="27" width="6" height="6" fill="rgba(75,127,212,.07)" rx="1" />
            </pattern>
          </defs>
          <rect width="600" height="900" fill="url(#agrid)" />
          <circle cx="480" cy="500" r="300" fill="none" stroke="rgba(26,63,122,.2)" strokeWidth="1" />
          <circle cx="480" cy="500" r="190" fill="none" stroke="rgba(26,63,122,.15)" strokeWidth="1" />
          <circle cx="480" cy="500" r="90" fill="rgba(26,63,122,.12)" />
        </svg>

        {/* Logo en haut */}
        <Link href="/" className="relative z-10 flex items-center gap-3 no-underline">
          <Image
            alt="Logo CZI"
            src="/brand/czi-logo.jpeg"
            width={42}
            height={42}
            className="rounded-[10px] object-cover"
          />
          <span className="flex flex-col leading-[1.25]">
            <span
              className="text-[0.88rem] font-extrabold tracking-[0.02em] text-white"
              style={{ fontFamily: ff.display }}
            >
              CZI
            </span>
            <span className="text-[0.65rem] tracking-[0.05em] text-white/50">
              Collectif Zéro Indigent
            </span>
          </span>
        </Link>

        {/* Logo showcase centré */}
        <div className="relative z-10 flex flex-col items-center py-10">
          <div className="relative mb-10" style={{ width: 180, height: 180 }}>
            <div className="auth-ring" />
            <div className="auth-ring-2" />
            <div
              className="h-full w-full overflow-hidden"
              style={{
                borderRadius: 22,
                border: "2px solid rgba(232,168,32,.4)",
                boxShadow: "0 0 60px rgba(26,63,122,.7), 0 0 30px rgba(232,168,32,.12)",
              }}
            >
              <Image
                alt="Logo CZI"
                src="/brand/czi-logo.jpeg"
                width={180}
                height={180}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <h2
            className="text-center text-white"
            style={{
              fontFamily: ff.serif,
              fontSize: "clamp(1.6rem, 2.2vw, 2.1rem)",
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: "1rem",
            }}
          >
            Jeunes entrepreneurs,<br />
            promoteurs des{" "}
            <em style={{ color: "#E8A820", fontStyle: "italic" }}>ODD.</em>
          </h2>

          <p
            className="max-w-[280px] text-center text-[0.9rem] leading-[1.7]"
            style={{ color: "rgba(255,255,255,.48)", fontFamily: ff.body }}
          >
            Rejoignez le réseau CZI pour transformer votre engagement en impact concret.
          </p>
        </div>

        {/* Stats en bas */}
        <div className="relative z-10 flex justify-center">
          {[
            { n: "ODD 1", l: "Vision" },
            { n: "2020", l: "Création" },
            { n: "07", l: "Axes" },
          ].map((s, i) => (
            <div
              key={s.n}
              className="flex flex-col gap-1"
              style={{
                padding: i === 0 ? "0 1.5rem 0 0" : "0 1.5rem",
                borderRight: i < 2 ? "1px solid rgba(255,255,255,.1)" : "none",
              }}
            >
              <span
                style={{ fontFamily: ff.display, fontSize: "1.4rem", fontWeight: 800, color: "#E8A820", lineHeight: 1 }}
              >
                {s.n}
              </span>
              <span style={{ fontSize: "0.67rem", color: "rgba(255,255,255,.35)", letterSpacing: "0.04em" }}>
                {s.l}
              </span>
            </div>
          ))}
        </div>

        <style>{`
          .auth-ring, .auth-ring-2 {
            position:absolute; border-radius:50%;
            inset:-22px; border:1px solid rgba(232,168,32,.2);
            animation:authRing 22s linear infinite;
          }
          .auth-ring-2 {
            inset:-44px; border:1px dashed rgba(75,127,212,.2);
            animation:authRing 40s linear infinite reverse;
          }
          .auth-ring::before, .auth-ring::after {
            content:''; position:absolute;
            width:8px; height:8px; border-radius:50%;
            background:#E8A820; top:50%; left:-4px; transform:translateY(-50%);
          }
          .auth-ring::after { left:auto; right:-4px; }
          @keyframes authRing { to { transform:rotate(360deg); } }
        `}</style>
      </div>

      {/* ── Panneau droit — formulaire ───────────── */}
      <div
        className="flex flex-1 flex-col items-center justify-center px-5 py-10 sm:px-8"
        style={{ background: "#F7F9FC" }}
      >
        {/* Logo mobile uniquement */}
        <Link href="/" className="mb-8 flex items-center gap-2 no-underline lg:hidden">
          <Image
            alt="Logo CZI"
            src="/brand/czi-logo.jpeg"
            width={38}
            height={38}
            className="rounded-[9px] object-cover"
            style={{ border: "2px solid rgba(13,37,80,.1)" }}
          />
          <span className="flex flex-col leading-[1.25]">
            <span
              className="text-[0.88rem] font-extrabold tracking-[0.02em] text-[#0D2550]"
              style={{ fontFamily: ff.display }}
            >
              CZI
            </span>
            <span className="text-[0.62rem] tracking-[0.05em] text-[#546180]">
              Collectif Zéro Indigent
            </span>
          </span>
        </Link>

        <div className="w-full max-w-[420px]">{children}</div>
      </div>
    </div>
  );
}
