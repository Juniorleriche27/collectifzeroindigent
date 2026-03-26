import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  marketingDisplayFont,
  marketingSerifFont,
  marketingBodyFont,
} from "@/components/marketing/fonts";
import { PublicFooter } from "@/components/marketing/public-footer";
import { PublicHeader } from "@/components/marketing/public-header";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function paramValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}
function safeNextPath(value: string): string | null {
  const n = value.trim();
  if (!n.startsWith("/") || n.startsWith("//")) return null;
  return n;
}

const axes = [
  { n: "Axe 01", ico: "👩‍💼", title: "Autonomisation économique des femmes et des jeunes" },
  { n: "Axe 02", ico: "💊", title: "Amélioration de la santé des populations" },
  { n: "Axe 03", ico: "🎓", title: "Transition école–marché du travail" },
  { n: "Axe 04", ico: "🫂", title: "Inclusion des publics vulnérables" },
  { n: "Axe 05", ico: "🗳️", title: "Engagement citoyen et bonne gouvernance" },
  { n: "Axe 06 — 07", ico: "♻️", title: "Résilience climatique & collaboration État–jeunesse" },
];

const gallery = [
  { src: "/brand/gallery/czi-photo-08.jpg", alt: "Grande mobilisation", em: "🤝" },
  { src: "/brand/gallery/czi-photo-01.jpg", alt: "Jeunes engagés", em: "🌱" },
  { src: "/brand/gallery/czi-photo-02.jpg", alt: "Action terrain", em: "⚡" },
  { src: "/brand/gallery/czi-photo-03.jpg", alt: "Programme social", em: "🏥" },
  { src: "/brand/gallery/czi-photo-04.jpg", alt: "Leadership & Formation", em: "🎓" },
];

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const code = paramValue(params.code);
  const nextPath = safeNextPath(paramValue(params.next));

  if (code) {
    const callbackParams = new URLSearchParams({ code });
    if (nextPath) callbackParams.set("next", nextPath);
    redirect(`/auth/callback?${callbackParams.toString()}`);
  }

  const ff = {
    display: "var(--font-marketing-display), sans-serif",
    serif: "var(--font-marketing-serif), Georgia, serif",
    body: "var(--font-marketing-body), sans-serif",
  };

  return (
    <div
      className={`${marketingDisplayFont.variable} ${marketingSerifFont.variable} ${marketingBodyFont.variable} overflow-x-hidden bg-white text-[#0D1829]`}
      style={{ fontFamily: ff.body }}
    >
      <PublicHeader />

      {/* ═══════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════ */}
      <section
        id="accueil"
        className="hero-section relative overflow-hidden"
        style={{ background: "#0D2550" }}
      >
        {/* SVG geometric background */}
        <svg
          className="pointer-events-none absolute inset-0"
          viewBox="0 0 1200 900"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="grid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <line x1="60" y1="0" x2="0" y2="60" stroke="rgba(232,168,32,.05)" strokeWidth="1" />
              <rect x="27" y="27" width="6" height="6" fill="rgba(75,127,212,.07)" rx="1" />
            </pattern>
          </defs>
          <rect width="1200" height="900" fill="url(#grid)" />
          <circle cx="950" cy="450" r="380" fill="none" stroke="rgba(26,63,122,.2)" strokeWidth="1" />
          <circle cx="950" cy="450" r="240" fill="none" stroke="rgba(26,63,122,.15)" strokeWidth="1" />
          <circle cx="950" cy="450" r="110" fill="rgba(26,63,122,.12)" />
        </svg>

        {/* Hero left */}
        <div className="hero-left relative z-10 flex flex-col justify-center">
          {/* Eyebrow */}
          <div
            className="hero-eyebrow mb-7 inline-flex w-fit items-center gap-[0.7rem] rounded-full border px-4 py-[0.38rem]"
            style={{ background: "rgba(232,168,32,.14)", borderColor: "rgba(232,168,32,.35)" }}
          >
            <span
              className="grid h-[26px] w-[26px] place-items-center rounded-full text-[0.58rem] font-extrabold leading-none tracking-[0.02em] text-[#0D2550]"
              style={{ background: "#E8A820", fontFamily: ff.display }}
            >
              ODD
            </span>
            <span
              className="text-[0.7rem] font-semibold uppercase tracking-[0.09em] text-[#F5C84A]"
              style={{ fontFamily: ff.display }}
            >
              Fondé le 17 avril 2020 · Togo
            </span>
          </div>

          {/* Title */}
          <h1
            className="hero-title mb-5 text-white"
            style={{
              fontFamily: ff.serif,
              fontSize: "clamp(2.4rem, 4.8vw, 5rem)",
              fontWeight: 700,
              lineHeight: 1.06,
            }}
          >
            Jeunes entrepreneurs,<br />
            promoteurs des{" "}
            <em style={{ fontStyle: "italic", color: "#E8A820" }}>ODD.</em>
          </h1>

          {/* Subtitle */}
          <p
            className="hero-sub mb-8 max-w-[430px]"
            style={{
              fontFamily: ff.body,
              fontSize: "clamp(0.95rem, 1.2vw, 1.05rem)",
              lineHeight: 1.76,
              color: "rgba(255,255,255,.58)",
            }}
          >
            CZI mobilise la jeunesse, les associations et les entrepreneurs
            autour d&apos;une ambition claire : transformer l&apos;engagement citoyen
            en impact concret pour les communautés.
          </p>

          {/* CTA buttons */}
          <div className="hero-actions mb-12 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-1 rounded-[8px] px-[1.5rem] py-[0.75rem] text-[0.78rem] font-bold uppercase tracking-[0.07em] no-underline transition-all duration-200 hover:brightness-110"
              style={{ background: "#E8A820", color: "#0D2550", fontFamily: ff.display }}
            >
              Rejoindre le collectif ↗
            </Link>
            <Link
              href="/#apropos"
              className="inline-flex items-center justify-center gap-1 rounded-[8px] border px-[1.5rem] py-[0.75rem] text-[0.78rem] font-bold uppercase tracking-[0.07em] no-underline transition-all duration-200 hover:border-[#E8A820] hover:text-[#E8A820]"
              style={{
                borderColor: "rgba(255,255,255,.35)",
                color: "rgba(255,255,255,.85)",
                fontFamily: ff.display,
              }}
            >
              En savoir plus
            </Link>
          </div>

          {/* Stats bar */}
          <div className="hero-stats flex flex-wrap gap-y-4">
            {[
              { n: "ODD 1", l: "Vision prioritaire" },
              { n: "2020", l: "Année de création" },
              { n: "07", l: "Axes stratégiques" },
            ].map((s, i) => (
              <div
                key={s.n}
                className="flex flex-col gap-[0.3rem]"
                style={{
                  padding: i === 0 ? "0 2rem 0 0" : "0 2rem",
                  borderRight: i < 2 ? "1px solid rgba(255,255,255,.1)" : "none",
                }}
              >
                <span
                  style={{
                    fontFamily: ff.display,
                    fontSize: "1.6rem",
                    fontWeight: 800,
                    color: "#E8A820",
                    lineHeight: 1,
                  }}
                >
                  {s.n}
                </span>
                <span style={{ fontSize: "0.73rem", color: "rgba(255,255,255,.38)", letterSpacing: "0.04em" }}>
                  {s.l}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Hero right — logo showcase (desktop only) */}
        <div className="hero-right relative z-10 hidden items-center justify-center lg:flex" style={{ padding: "4rem" }}>
          <div className="logo-showcase relative" style={{ width: 300, height: 300 }}>
            <div className="logo-ring" />
            <div className="logo-ring-2" />
            <div
              className="logo-img-wrap h-full w-full overflow-hidden"
              style={{
                borderRadius: 28,
                border: "3px solid rgba(232,168,32,.4)",
                boxShadow: "0 0 90px rgba(26,63,122,.7), 0 0 40px rgba(232,168,32,.15)",
              }}
            >
              <Image
                alt="Logo CZI"
                src="/brand/czi-logo.jpeg"
                width={300}
                height={300}
                className="h-full w-full object-cover"
                priority
              />
            </div>

            {/* Orbit pills */}
            {[
              { pos: "ob-top", ico: "🤝", txt: "Solidarité" },
              { pos: "ob-right", ico: "🌱", txt: "Durabilité" },
              { pos: "ob-bottom", ico: "⚡", txt: "Impact" },
              { pos: "ob-left", ico: "🎓", txt: "Formation" },
            ].map((o) => (
              <div key={o.txt} className={`orbit ${o.pos}`}>
                <div
                  className="orbit-pill flex items-center gap-2 rounded-[12px] px-[0.9rem] py-[0.6rem]"
                  style={{
                    background: "rgba(13,37,80,.85)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(232,168,32,.3)",
                    boxShadow: "0 4px 20px rgba(0,0,0,.3)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ fontSize: "1.1rem" }}>{o.ico}</span>
                  <span
                    style={{
                      fontFamily: ff.display,
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,.7)",
                    }}
                  >
                    {o.txt}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 z-[1]"
          style={{ height: 80, background: "linear-gradient(transparent, #0D2550)" }}
        />
      </section>

      {/* ═══════════════════════════════════════════════════
          ABOUT — split full-bleed
      ═══════════════════════════════════════════════════ */}
      <section id="apropos" className="grid lg:grid-cols-2">
        {/* Left — off-white */}
        <div className="about-left flex flex-col justify-center" style={{ background: "#F7F9FC" }}>
          <span
            className="mb-[0.9rem] inline-flex items-center gap-[0.6rem] text-[0.68rem] font-bold uppercase tracking-[0.15em] text-[#1A3F7A]"
            style={{ fontFamily: ff.display }}
          >
            À propos du CZI
          </span>
          <h2
            className="mb-[1.4rem]"
            style={{
              fontFamily: ff.serif,
              fontSize: "clamp(1.8rem, 2.8vw, 2.7rem)",
              fontWeight: 700,
              lineHeight: 1.2,
              color: "#0D1829",
            }}
          >
            Une jeunesse qui agit pour des communautés plus résilientes.
          </h2>
          <p
            className="mb-[2rem] max-w-[480px]"
            style={{ fontFamily: ff.body, fontSize: "1rem", lineHeight: 1.76, color: "#546180" }}
          >
            Le Collectif Zéro Indigent est un réseau de jeunes, d&apos;associations et
            d&apos;entrepreneurs mobilisés pour accélérer l&apos;atteinte des ODD, avec un
            focus prioritaire sur la lutte contre la pauvreté et l&apos;autonomisation durable.
          </p>

          {/* Chips */}
          <div className="mb-8 flex flex-wrap gap-[0.45rem]">
            {["Citoyenneté", "Santé", "Inclusion", "Emploi", "Climat", "Paix"].map((c) => (
              <span
                key={c}
                className="cursor-default rounded-full border-[1.5px] px-[0.9rem] py-[0.36rem] text-[0.66rem] font-semibold uppercase tracking-[0.06em] text-[#1A3F7A] transition-all duration-200 hover:bg-[#1A3F7A] hover:text-white"
                style={{ borderColor: "#1A3F7A", fontFamily: ff.display }}
              >
                {c}
              </span>
            ))}
          </div>

          {/* Pillars 2×2 */}
          <div
            className="pillars-grid overflow-hidden rounded-xl"
            style={{
              background: "rgba(26,63,122,.12)",
              border: "1px solid rgba(26,63,122,.12)",
            }}
          >
            {[
              { k: "La vision", p: "Contribuer, grâce à la synergie des jeunes, à l'atteinte des ODD." },
              { k: "La mission", p: "Outiller et accompagner la jeunesse vers l'insertion et l'impact local." },
              { k: "Cibles", p: "Jeunes, femmes, entrepreneurs, associations et personnes vulnérables." },
              { k: "ODD Prioritaire", p: "ODD 1 — Éliminer l'extrême pauvreté et garantir l'autonomie." },
            ].map((pill) => (
              <div key={pill.k} className="bg-white" style={{ padding: "1.3rem 1.5rem" }}>
                <p
                  className="mb-[0.45rem] flex items-center gap-[0.4rem] text-[0.62rem] font-bold uppercase tracking-[0.13em]"
                  style={{ color: "#E8A820", fontFamily: ff.display }}
                >
                  <span className="inline-block h-[2px] w-[10px] bg-[#E8A820]" />
                  {pill.k}
                </p>
                <p style={{ fontFamily: ff.body, fontSize: "0.86rem", lineHeight: 1.55, color: "#546180" }}>
                  {pill.p}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — dark blue panel */}
        <div
          className="about-right relative flex flex-col justify-end overflow-hidden"
          style={{ background: "#0D2550" }}
        >
          {/* SVG deco */}
          <svg
            className="pointer-events-none absolute inset-0"
            viewBox="0 0 600 800"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="300" cy="300" r="280" fill="none" stroke="rgba(232,168,32,.07)" strokeWidth="1" />
            <circle cx="300" cy="300" r="180" fill="none" stroke="rgba(75,127,212,.1)" strokeWidth="1" />
            <circle cx="300" cy="300" r="80" fill="rgba(26,63,122,.15)" />
          </svg>

          {/* Floating logo */}
          <div
            className="absolute overflow-hidden"
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -60%)",
              width: 120,
              height: 120,
              borderRadius: 20,
              border: "2px solid rgba(232,168,32,.5)",
              boxShadow: "0 12px 60px rgba(0,0,0,.5), 0 0 40px rgba(26,63,122,.5)",
              zIndex: 2,
            }}
          >
            <Image
              alt="CZI"
              src="/brand/czi-logo.jpeg"
              width={120}
              height={120}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Quote card */}
          <div
            className="relative z-[3] rounded-2xl"
            style={{
              background: "rgba(13,37,80,.8)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(232,168,32,.3)",
              padding: "1.8rem 2rem",
              margin: "2.5rem",
            }}
          >
            <span
              style={{
                fontFamily: ff.serif,
                fontSize: "3.5rem",
                lineHeight: 0.6,
                color: "#E8A820",
                opacity: 0.6,
                display: "block",
                marginBottom: "0.6rem",
              }}
            >
              "
            </span>
            <p
              style={{
                fontFamily: ff.serif,
                fontSize: "clamp(1rem, 1.4vw, 1.28rem)",
                fontStyle: "italic",
                fontWeight: 700,
                color: "#fff",
                lineHeight: 1.45,
                marginBottom: "1.2rem",
              }}
            >
              Faire de chaque jeune un acteur engagé dans l&apos;atteinte des ODD.
            </p>
            <span
              className="inline-flex items-center gap-[0.6rem] text-[0.7rem] font-semibold uppercase tracking-[0.12em]"
              style={{ color: "#F5C84A", fontFamily: ff.display }}
            >
              <span className="inline-block h-[1px] w-5 bg-[#F5C84A]" />
              Collectif Zéro Indigent
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          AXES STRATÉGIQUES
      ═══════════════════════════════════════════════════ */}
      <section id="axes" className="section-axes" style={{ background: "#0D1829" }}>
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <span
              className="mb-[0.9rem] inline-flex items-center gap-[0.6rem] text-[0.68rem] font-bold uppercase tracking-[0.15em]"
              style={{ color: "#F5C84A", fontFamily: ff.display }}
            >
              <span className="inline-block h-[2px] w-[22px] bg-[#F5C84A]" />
              Priorités CZI
            </span>
            <h2
              style={{
                fontFamily: ff.serif,
                fontSize: "clamp(1.8rem, 2.8vw, 2.7rem)",
                fontWeight: 700,
                color: "#fff",
                lineHeight: 1.2,
                marginBottom: 0,
              }}
            >
              Les 07 axes<br />stratégiques
            </h2>
          </div>
          <p
            className="max-w-[280px] text-[0.9rem] leading-[1.65] lg:text-right"
            style={{ color: "rgba(255,255,255,.35)", fontFamily: ff.body }}
          >
            Chaque axe est un levier d&apos;action concret pour transformer
            l&apos;engagement citoyen en impact durable sur les communautés.
          </p>
        </div>

        {/* Grid */}
        <div
          className="axes-grid overflow-hidden rounded-[14px]"
          style={{
            background: "rgba(255,255,255,.05)",
            border: "1px solid rgba(255,255,255,.06)",
          }}
        >
          {/* Axes 1–3 */}
          {axes.slice(0, 3).map((a) => (
            <div
              key={a.n}
              className="axe-card group relative overflow-hidden"
              style={{ background: "#171b28", padding: "2rem 1.8rem" }}
            >
              <p
                className="mb-4 text-[0.6rem] font-bold uppercase tracking-[0.18em]"
                style={{ color: "rgba(255,255,255,.2)", fontFamily: ff.display }}
              >
                {a.n}
              </p>
              <span className="mb-3 block text-[2rem]">{a.ico}</span>
              <h3
                style={{
                  fontFamily: ff.serif,
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  lineHeight: 1.35,
                  color: "#fff",
                }}
              >
                {a.title}
              </h3>
            </div>
          ))}

          {/* Featured axe */}
          <div
            className="featured-axe flex flex-col justify-end"
            style={{
              background: "#1A3F7A",
              padding: "2.5rem 2rem",
              borderTop: "3px solid #E8A820",
            }}
          >
            <div
              className="mb-6 overflow-hidden rounded-[10px]"
              style={{ width: 48, height: 48, border: "2px solid rgba(232,168,32,.45)" }}
            >
              <Image
                alt="CZI"
                src="/brand/czi-logo.jpeg"
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            </div>
            <p
              className="mb-4 text-[0.6rem] font-bold uppercase tracking-[0.18em]"
              style={{ color: "rgba(255,255,255,.4)", fontFamily: ff.display }}
            >
              CZI · 7 axes
            </p>
            <h3
              style={{
                fontFamily: ff.serif,
                fontSize: "1.3rem",
                fontWeight: 700,
                lineHeight: 1.3,
                color: "#F5C84A",
              }}
            >
              Ensemble pour un Togo résilient et inclusif
            </h3>
            <p
              className="mt-3 text-[0.86rem] leading-[1.6]"
              style={{ color: "rgba(255,255,255,.55)", fontFamily: ff.body }}
            >
              Une approche intégrée couvrant l&apos;emploi, la santé, l&apos;inclusion,
              le climat et la gouvernance pour construire un avenir meilleur.
            </p>
          </div>

          {/* Axes 4–6 */}
          {axes.slice(3).map((a) => (
            <div
              key={a.n}
              className="axe-card group relative overflow-hidden"
              style={{ background: "#171b28", padding: "2rem 1.8rem" }}
            >
              <p
                className="mb-4 text-[0.6rem] font-bold uppercase tracking-[0.18em]"
                style={{ color: "rgba(255,255,255,.2)", fontFamily: ff.display }}
              >
                {a.n}
              </p>
              <span className="mb-3 block text-[2rem]">{a.ico}</span>
              <h3
                style={{
                  fontFamily: ff.serif,
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  lineHeight: 1.35,
                  color: "#fff",
                }}
              >
                {a.title}
              </h3>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          GALERIE
      ═══════════════════════════════════════════════════ */}
      <section id="galerie" className="section-galerie" style={{ background: "#F2F5FB" }}>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span
              className="mb-[0.9rem] inline-flex items-center gap-[0.6rem] text-[0.68rem] font-bold uppercase tracking-[0.15em] text-[#1A3F7A]"
              style={{ fontFamily: ff.display }}
            >
              <span className="inline-block h-[2px] w-[22px] bg-[#1A3F7A]" />
              Galerie
            </span>
            <h2
              style={{
                fontFamily: ff.serif,
                fontSize: "clamp(1.8rem, 2.8vw, 2.7rem)",
                fontWeight: 700,
                lineHeight: 1.2,
                color: "#0D1829",
                marginBottom: 0,
              }}
            >
              Le CZI en images
            </h2>
          </div>
        </div>

        {/* Editorial grid */}
        <div className="gallery-grid">
          {gallery.map((item, i) => (
            <div
              key={item.src}
              className={`gal-item gal-${i} group relative overflow-hidden rounded-[10px]`}
            >
              <Image
                alt={item.alt}
                src={item.src}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              <div
                className="absolute inset-0 flex flex-col justify-end opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background: "linear-gradient(to top, rgba(13,37,80,.85) 0%, transparent 55%)",
                  padding: "1rem 1.2rem",
                }}
              >
                <span
                  className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-white"
                  style={{ fontFamily: ff.display }}
                >
                  {item.alt}
                </span>
              </div>
              <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[4.5rem] opacity-[0.1]">
                {item.em}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          CTA
      ═══════════════════════════════════════════════════ */}
      <section
        className="section-cta relative overflow-hidden"
        style={{ background: "#0D2550" }}
      >
        {/* Watermark logo */}
        <div className="pointer-events-none absolute right-[-2rem] top-1/2 z-0 -translate-y-1/2">
          <Image
            alt=""
            src="/brand/czi-logo.jpeg"
            width={360}
            height={360}
            className="object-contain"
            style={{ opacity: 0.04, filter: "grayscale(1) brightness(5)" }}
            aria-hidden
          />
        </div>

        <div className="relative z-[2] grid items-center gap-12 lg:grid-cols-2 lg:gap-24">
          <div>
            <span
              className="mb-[0.9rem] inline-flex items-center gap-[0.6rem] text-[0.68rem] font-bold uppercase tracking-[0.15em]"
              style={{ color: "#F5C84A", fontFamily: ff.display }}
            >
              <span className="inline-block h-[2px] w-[22px] bg-[#F5C84A]" />
              Agir ensemble
            </span>
            <h2
              style={{
                fontFamily: ff.serif,
                fontSize: "clamp(2.2rem, 4vw, 4.5rem)",
                fontWeight: 700,
                lineHeight: 1.1,
                color: "#fff",
              }}
            >
              Rejoignez la<br />dynamique{" "}
              <em style={{ fontStyle: "italic", color: "#E8A820" }}>CZI</em><br />
              et transformez<br />votre engagement.
            </h2>
          </div>

          <div>
            <p
              className="mb-7 text-[0.97rem] leading-[1.75]"
              style={{ color: "rgba(255,255,255,.55)", fontFamily: ff.body }}
            >
              Des milliers de jeunes, associations et entrepreneurs se mobilisent
              déjà à travers le collectif. Chaque action compte pour construire
              un avenir plus juste et inclusif pour nos communautés.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-1 rounded-[8px] px-[1.5rem] py-[0.8rem] text-[0.78rem] font-bold uppercase tracking-[0.07em] no-underline transition-all duration-200 hover:brightness-110"
                style={{ background: "#E8A820", color: "#0D2550", fontFamily: ff.display }}
              >
                Créer un compte ↗
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-1 rounded-[8px] border px-[1.5rem] py-[0.8rem] text-[0.78rem] font-bold uppercase tracking-[0.07em] no-underline transition-all duration-200 hover:border-[#E8A820] hover:text-[#E8A820]"
                style={{
                  borderColor: "rgba(255,255,255,.35)",
                  color: "rgba(255,255,255,.85)",
                  fontFamily: ff.display,
                }}
              >
                Connexion membre
              </Link>
            </div>
            <div
              className="mt-5 flex items-center gap-[0.6rem] text-[0.77rem]"
              style={{ color: "rgba(255,255,255,.28)", fontFamily: ff.body }}
            >
              <Image
                alt=""
                src="/brand/czi-logo.jpeg"
                width={22}
                height={22}
                className="rounded-[5px] object-cover opacity-45"
                aria-hidden
              />
              Accès plateforme · Ressources · Communauté
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />

      <style>{`
        /* ─── Hero ──────────────────────────────────── */
        .hero-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 100vh;
          padding-top: 72px;
        }
        .hero-left { padding: 5rem 4rem 8rem 4.5rem; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-eyebrow { animation: fadeUp .5s ease both .1s; }
        .hero-title   { animation: fadeUp .6s ease both .25s; }
        .hero-sub     { animation: fadeUp .6s ease both .4s; }
        .hero-actions { animation: fadeUp .6s ease both .55s; }
        .hero-stats   { animation: fadeUp .6s ease both .7s; }

        /* Logo showcase rings */
        .logo-ring, .logo-ring-2 {
          position: absolute; border-radius: 50%;
          inset: -28px; border: 1px solid rgba(232,168,32,.2);
          animation: rotateRing 22s linear infinite;
        }
        .logo-ring-2 {
          inset: -56px; border: 1px dashed rgba(75,127,212,.2);
          animation: rotateRing 40s linear infinite reverse;
        }
        .logo-ring::before, .logo-ring::after {
          content:''; position:absolute;
          width:10px; height:10px; border-radius:50%;
          background:#E8A820; top:50%; left:-5px; transform:translateY(-50%);
        }
        .logo-ring::after { left:auto; right:-5px; }
        @keyframes rotateRing { to { transform: rotate(360deg); } }

        /* Orbit positions */
        .ob-top    { position:absolute; top:-48px; left:50%; transform:translateX(-50%); }
        .ob-right  { position:absolute; right:-130px; top:50%; transform:translateY(-50%); }
        .ob-bottom { position:absolute; bottom:-48px; left:50%; transform:translateX(-50%); }
        .ob-left   { position:absolute; left:-130px; top:50%; transform:translateY(-50%); }
        .orbit { position:absolute; display:flex; flex-direction:column; align-items:center; gap:.3rem; }

        /* ─── About ─────────────────────────────────── */
        .about-left { padding: 5rem 4.5rem; }
        .about-right { min-height: 520px; }
        .pillars-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; }

        /* ─── Axes ──────────────────────────────────── */
        .section-axes { padding: 6rem 4.5rem; }
        .axes-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
        }
        .featured-axe { grid-column: 4; grid-row: 1 / 3; }

        .axe-card::before {
          content:''; position:absolute; top:0; left:0; right:0; height:3px;
          background:transparent; transition:background .25s;
        }
        .axe-card:hover { background: #1e2337 !important; }
        .axe-card:hover::before { background: #E8A820; }

        /* ─── Gallery ───────────────────────────────── */
        .section-galerie { padding: 6rem 4.5rem; }
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          grid-template-rows: 220px 170px;
          gap: 8px;
        }
        .gal-0 { grid-column: span 5; grid-row: span 2; }
        .gal-1 { grid-column: span 4; }
        .gal-2 { grid-column: span 3; }
        .gal-3 { grid-column: span 3; }
        .gal-4 { grid-column: span 4; }

        /* ─── CTA ───────────────────────────────────── */
        .section-cta { padding: 7rem 4.5rem; }

        /* ─── TABLET (768px – 1023px) ───────────────── */
        @media (max-width: 1023px) {
          .hero-section { grid-template-columns: 1fr !important; }
          .hero-right   { display: none !important; }
          .hero-left    { padding: 6rem 3rem 5rem !important; }

          .about-left   { padding: 4rem 3rem !important; }
          .about-right  { min-height: 380px !important; }

          .section-axes { padding: 4.5rem 2.5rem !important; }
          .axes-grid    { grid-template-columns: 1fr 1fr 1fr !important; }
          .featured-axe { grid-column: auto !important; grid-row: auto !important; }

          .section-galerie { padding: 4.5rem 2.5rem !important; }
          .gallery-grid {
            grid-template-columns: repeat(6, 1fr) !important;
            grid-template-rows: 200px 160px !important;
            gap: 6px !important;
          }
          .gal-0 { grid-column: span 4 !important; grid-row: span 1 !important; }
          .gal-1 { grid-column: span 2 !important; }
          .gal-2 { grid-column: span 2 !important; }
          .gal-3 { grid-column: span 2 !important; }
          .gal-4 { grid-column: span 2 !important; }

          .section-cta { padding: 5rem 2.5rem !important; }
        }

        /* ─── MOBILE (≤ 639px) ──────────────────────── */
        @media (max-width: 639px) {
          .hero-left { padding: 5rem 1.25rem 3.5rem !important; }

          .about-left  { padding: 3rem 1.25rem !important; }
          .about-right { min-height: 300px !important; }

          .pillars-grid { grid-template-columns: 1fr !important; }

          .section-axes { padding: 3.5rem 1.25rem !important; }
          .axes-grid    { grid-template-columns: 1fr 1fr !important; }
          .featured-axe { grid-column: span 2 !important; grid-row: auto !important; }

          .section-galerie { padding: 3.5rem 1.25rem !important; }
          .gallery-grid {
            grid-template-columns: 1fr 1fr !important;
            grid-template-rows: repeat(3, 160px) !important;
            gap: 6px !important;
          }
          .gal-0 { grid-column: span 2 !important; grid-row: span 1 !important; }
          .gal-1 { grid-column: span 1 !important; }
          .gal-2 { grid-column: span 1 !important; }
          .gal-3 { grid-column: span 1 !important; }
          .gal-4 { grid-column: span 2 !important; }

          .section-cta { padding: 4rem 1.25rem !important; }
        }
      `}</style>
    </div>
  );
}
