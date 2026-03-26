import Image from "next/image";
import Link from "next/link";

import {
  marketingDisplayFont,
  marketingSerifFont,
  marketingBodyFont,
} from "@/components/marketing/fonts";
import { PublicFooter } from "@/components/marketing/public-footer";
import { PublicHeader } from "@/components/marketing/public-header";

const governancePillars = [
  "Synergie d'actions entre les jeunes",
  "Orientation, formation et employabilité",
  "Innovation, entrepreneuriat et création de richesses",
  "Inclusion des filles, femmes et personnes vulnérables",
];

const targets = [
  { ico: "👤", label: "Jeunes" },
  { ico: "💼", label: "Entrepreneurs" },
  { ico: "🤝", label: "Associations et mouvements de jeunes" },
  { ico: "👩", label: "Filles et femmes" },
  { ico: "♿", label: "Personnes en situation de handicap" },
];

const domains = [
  { ico: "🏛️", label: "Citoyenneté et développement local" },
  { ico: "💊", label: "Santé et bien-être" },
  { ico: "🛡️", label: "Inclusion, sécurité et droits humains" },
  { ico: "📈", label: "Insertion professionnelle et croissance économique" },
  { ico: "♻️", label: "Réchauffement climatique et énergies renouvelables" },
];

export default function PublicAboutPage() {
  const ff = {
    display: "var(--font-marketing-display), sans-serif",
    serif:   "var(--font-marketing-serif), Georgia, serif",
    body:    "var(--font-marketing-body), sans-serif",
  };

  return (
    <div
      className={`${marketingDisplayFont.variable} ${marketingSerifFont.variable} ${marketingBodyFont.variable} overflow-x-hidden bg-white text-[#0D1829]`}
      style={{ fontFamily: ff.body }}
    >
      <PublicHeader showAboutLink={false} />

      {/* ── Hero mini ───────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ paddingTop: 72, background: "#0D2550", minHeight: 380 }}
      >
        <svg
          className="pointer-events-none absolute inset-0"
          viewBox="0 0 1200 400"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="agrid2" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <line x1="60" y1="0" x2="0" y2="60" stroke="rgba(232,168,32,.05)" strokeWidth="1" />
              <rect x="27" y="27" width="6" height="6" fill="rgba(75,127,212,.07)" rx="1" />
            </pattern>
          </defs>
          <rect width="1200" height="400" fill="url(#agrid2)" />
          <circle cx="1000" cy="200" r="260" fill="none" stroke="rgba(26,63,122,.2)" strokeWidth="1" />
          <circle cx="1000" cy="200" r="160" fill="none" stroke="rgba(26,63,122,.12)" strokeWidth="1" />
        </svg>

        <div
          className="relative z-10 mx-auto flex w-full max-w-[1320px] flex-col items-start justify-end px-6 pb-16 pt-14 lg:px-14"
        >
          <div
            className="mb-4 inline-flex items-center gap-[0.7rem] rounded-full border px-4 py-[0.38rem]"
            style={{ background: "rgba(232,168,32,.14)", borderColor: "rgba(232,168,32,.35)" }}
          >
            <span
              className="grid h-[24px] w-[24px] place-items-center rounded-full text-[0.55rem] font-extrabold text-[#0D2550]"
              style={{ background: "#E8A820", fontFamily: ff.display }}
            >
              CZI
            </span>
            <span
              className="text-[0.68rem] font-semibold uppercase tracking-[0.09em] text-[#F5C84A]"
              style={{ fontFamily: ff.display }}
            >
              À propos du collectif
            </span>
          </div>

          <h1
            className="text-white"
            style={{
              fontFamily: ff.serif,
              fontSize: "clamp(2.2rem, 4vw, 3.8rem)",
              fontWeight: 700,
              lineHeight: 1.1,
              marginBottom: "1rem",
            }}
          >
            Construire un avenir durable<br />
            avec la <em style={{ color: "#E8A820", fontStyle: "italic" }}>jeunesse.</em>
          </h1>

          <p
            className="max-w-[520px]"
            style={{ fontFamily: ff.body, fontSize: "1rem", lineHeight: 1.75, color: "rgba(255,255,255,.55)" }}
          >
            Le CZI est un cadre d&apos;engagement citoyen fondé par des jeunes pour des jeunes,
            pour transformer les communautés par l&apos;innovation sociale et économique.
          </p>

          <div className="mt-7 flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-1 rounded-[6px] px-[1.4rem] py-[0.6rem] text-[0.74rem] font-bold uppercase tracking-[0.07em] no-underline transition-all duration-200 hover:bg-[#F5C84A]"
              style={{ background: "#E8A820", color: "#0D2550", fontFamily: ff.display }}
            >
              Rejoindre CZI ↗
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1 rounded-[6px] border px-[1.4rem] py-[0.6rem] text-[0.74rem] font-bold uppercase tracking-[0.07em] no-underline transition-all duration-200 hover:border-[#E8A820] hover:text-[#E8A820]"
              style={{ borderColor: "rgba(255,255,255,.35)", color: "rgba(255,255,255,.85)", fontFamily: ff.display }}
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>

        {/* Bottom fade */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0"
          style={{ height: 80, background: "linear-gradient(transparent, #0D2550)" }}
        />
      </section>

      {/* ── Vision & Mission — split ─────────────── */}
      <section className="grid lg:grid-cols-2">
        <div
          className="flex flex-col justify-center"
          style={{ padding: "5rem 4.5rem", background: "#F7F9FC" }}
        >
          <span
            className="mb-[0.9rem] inline-flex items-center gap-[0.6rem] text-[0.68rem] font-bold uppercase tracking-[0.15em] text-[#1A3F7A]"
            style={{ fontFamily: ff.display }}
          >
            <span className="inline-block h-[2px] w-[22px] bg-[#1A3F7A]" />
            Vision & Mission
          </span>
          <h2
            style={{
              fontFamily: ff.serif,
              fontSize: "clamp(1.7rem, 2.5vw, 2.4rem)",
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: "1.2rem",
            }}
          >
            Une approche intégrée pour un Togo plus résilient.
          </h2>

          <div
            className="mb-6 overflow-hidden rounded-xl"
            style={{ border: "1px solid rgba(26,63,122,.12)", display: "grid", gridTemplateColumns: "1fr", gap: "1px", background: "rgba(26,63,122,.12)" }}
          >
            {[
              {
                k: "Vision",
                p: "Contribuer, grâce à la synergie d'actions des jeunes, à l'atteinte des ODD, avec un accent sur l'ODD 1.",
              },
              {
                k: "Mission",
                p: "Outiller, orienter et accompagner les jeunes pour accélérer leur insertion, promouvoir l'innovation et l'impact social.",
              },
              {
                k: "Fondé le",
                p: "17 avril 2020 — Togo. Un collectif de jeunes pour les communautés africaines.",
              },
            ].map((item) => (
              <div key={item.k} className="bg-white" style={{ padding: "1.3rem 1.5rem" }}>
                <p
                  className="mb-2 flex items-center gap-[0.4rem] text-[0.62rem] font-bold uppercase tracking-[0.13em]"
                  style={{ color: "#E8A820", fontFamily: ff.display }}
                >
                  <span className="inline-block h-[2px] w-[10px] bg-[#E8A820]" />
                  {item.k}
                </p>
                <p style={{ fontFamily: ff.body, fontSize: "0.9rem", lineHeight: 1.65, color: "#546180" }}>
                  {item.p}
                </p>
              </div>
            ))}
          </div>

          {/* Chips */}
          <div className="flex flex-wrap gap-[0.45rem]">
            {["Citoyenneté", "Santé", "Inclusion", "Emploi", "Climat", "Paix", "ODD"].map((c) => (
              <span
                key={c}
                className="cursor-default rounded-full border-[1.5px] px-[0.9rem] py-[0.36rem] text-[0.66rem] font-semibold uppercase tracking-[0.06em] text-[#1A3F7A] transition-all duration-200 hover:bg-[#1A3F7A] hover:text-white"
                style={{ borderColor: "#1A3F7A", fontFamily: ff.display }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Right — photo */}
        <div className="relative overflow-hidden" style={{ minHeight: 420 }}>
          <Image
            alt="Mobilisation CZI"
            src="/brand/gallery/czi-photo-08.jpg"
            fill
            className="object-cover"
            sizes="50vw"
          />
          {/* Quote overlay */}
          <div
            className="absolute bottom-0 left-0 right-0 p-8"
            style={{ background: "linear-gradient(transparent, rgba(13,37,80,.92))" }}
          >
            <div
              className="rounded-2xl p-5"
              style={{
                background: "rgba(13,37,80,.75)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(232,168,32,.3)",
              }}
            >
              <span
                style={{ fontFamily: ff.serif, fontSize: "3rem", lineHeight: 0.6, color: "#E8A820", opacity: 0.6, display: "block", marginBottom: "0.5rem" }}
              >
                "
              </span>
              <p style={{ fontFamily: ff.serif, fontSize: "1.1rem", fontStyle: "italic", fontWeight: 700, color: "#fff", lineHeight: 1.4 }}>
                Faire de chaque jeune un acteur engagé dans l&apos;atteinte des ODD.
              </p>
              <span
                className="mt-3 inline-flex items-center gap-[0.5rem] text-[0.68rem] font-semibold uppercase tracking-[0.1em]"
                style={{ color: "#F5C84A", fontFamily: ff.display }}
              >
                <span className="inline-block h-[1px] w-4 bg-[#F5C84A]" />
                Collectif Zéro Indigent
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Cibles + Domaines — fond ink ────────── */}
      <section style={{ padding: "6rem 4.5rem", background: "#0D1829" }}>
        <div
          className="mx-auto mb-12 max-w-[1320px]"
        >
          <span
            className="mb-[0.9rem] inline-flex items-center gap-[0.6rem] text-[0.68rem] font-bold uppercase tracking-[0.15em]"
            style={{ color: "#F5C84A", fontFamily: ff.display }}
          >
            <span className="inline-block h-[2px] w-[22px] bg-[#F5C84A]" />
            Qui nous ciblons
          </span>
          <h2
            style={{
              fontFamily: ff.serif,
              fontSize: "clamp(1.7rem, 2.5vw, 2.4rem)",
              fontWeight: 700,
              lineHeight: 1.2,
              color: "#fff",
              marginBottom: "2.5rem",
            }}
          >
            Cibles & domaines d&apos;intervention
          </h2>
        </div>

        <div className="mx-auto grid max-w-[1320px] gap-8 lg:grid-cols-2">
          {/* Cibles */}
          <div>
            <p
              className="mb-4 text-[0.62rem] font-bold uppercase tracking-[0.18em]"
              style={{ color: "rgba(255,255,255,.25)", fontFamily: ff.display }}
            >
              Publics prioritaires
            </p>
            <div className="space-y-[1px] overflow-hidden rounded-xl" style={{ border: "1px solid rgba(255,255,255,.07)" }}>
              {targets.map((t) => (
                <div
                  key={t.label}
                  className="flex items-center gap-4 transition-colors duration-150 hover:bg-[#1e2337]"
                  style={{ background: "#171b28", padding: "1rem 1.4rem" }}
                >
                  <span className="text-[1.3rem]">{t.ico}</span>
                  <span style={{ fontFamily: ff.body, fontSize: "0.92rem", color: "rgba(255,255,255,.75)" }}>
                    {t.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Domaines */}
          <div>
            <p
              className="mb-4 text-[0.62rem] font-bold uppercase tracking-[0.18em]"
              style={{ color: "rgba(255,255,255,.25)", fontFamily: ff.display }}
            >
              Domaines d&apos;intervention
            </p>
            <div className="space-y-[1px] overflow-hidden rounded-xl" style={{ border: "1px solid rgba(255,255,255,.07)" }}>
              {domains.map((d) => (
                <div
                  key={d.label}
                  className="flex items-center gap-4 transition-colors duration-150 hover:bg-[#1e2337]"
                  style={{ background: "#171b28", padding: "1rem 1.4rem" }}
                >
                  <span className="text-[1.3rem]">{d.ico}</span>
                  <span style={{ fontFamily: ff.body, fontSize: "0.92rem", color: "rgba(255,255,255,.75)" }}>
                    {d.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Fondamentaux — fond off-white ──────── */}
      <section style={{ padding: "6rem 4.5rem", background: "#F7F9FC" }}>
        <div className="mx-auto max-w-[1320px]">
          <span
            className="mb-[0.9rem] inline-flex items-center gap-[0.6rem] text-[0.68rem] font-bold uppercase tracking-[0.15em] text-[#1A3F7A]"
            style={{ fontFamily: ff.display }}
          >
            <span className="inline-block h-[2px] w-[22px] bg-[#1A3F7A]" />
            Fondamentaux CZI
          </span>
          <h2
            style={{
              fontFamily: ff.serif,
              fontSize: "clamp(1.7rem, 2.5vw, 2.4rem)",
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: "2.5rem",
              color: "#0D1829",
            }}
          >
            Les piliers de notre engagement
          </h2>

          <div
            className="overflow-hidden rounded-xl"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1px",
              background: "rgba(26,63,122,.12)",
              border: "1px solid rgba(26,63,122,.12)",
            }}
          >
            {governancePillars.map((pillar, i) => (
              <div key={pillar} className="bg-white" style={{ padding: "2rem 1.8rem" }}>
                <p
                  className="mb-3 flex items-center gap-[0.4rem] text-[0.62rem] font-bold uppercase tracking-[0.13em]"
                  style={{ color: "#E8A820", fontFamily: ff.display }}
                >
                  <span className="inline-block h-[2px] w-[10px] bg-[#E8A820]" />
                  Pilier {String(i + 1).padStart(2, "0")}
                </p>
                <p style={{ fontFamily: ff.body, fontSize: "0.95rem", lineHeight: 1.65, color: "#546180" }}>
                  {pillar}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Galerie photos ───────────────────────── */}
      <section style={{ padding: "6rem 4.5rem", background: "#F2F5FB" }}>
        <div className="mx-auto max-w-[1320px]">
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
              fontSize: "clamp(1.7rem, 2.5vw, 2.4rem)",
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: "2.5rem",
              color: "#0D1829",
            }}
          >
            CZI en images
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "/brand/gallery/czi-photo-01.jpg",
              "/brand/gallery/czi-photo-02.jpg",
              "/brand/gallery/czi-photo-06.jpg",
            ].map((src) => (
              <div
                key={src}
                className="group overflow-hidden rounded-[10px]"
                style={{ height: 240, position: "relative" }}
              >
                <Image
                  alt="Activités CZI"
                  src={src}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ───────────────────────────── */}
      <section style={{ padding: "7rem 4.5rem", background: "#0D2550", position: "relative", overflow: "hidden" }}>
        <div
          className="pointer-events-none absolute right-[-2rem] top-1/2 -translate-y-1/2"
        >
          <Image
            alt=""
            src="/brand/czi-logo.jpeg"
            width={380}
            height={380}
            className="object-contain"
            style={{ opacity: 0.04, filter: "grayscale(1) brightness(5)" }}
            aria-hidden
          />
        </div>
        <div className="relative z-[2] mx-auto max-w-[700px] text-center">
          <span
            className="mb-[0.9rem] inline-flex items-center gap-[0.6rem] text-[0.68rem] font-bold uppercase tracking-[0.15em]"
            style={{ color: "#F5C84A", fontFamily: ff.display }}
          >
            <span className="inline-block h-[2px] w-[22px] bg-[#F5C84A]" />
            Rejoignez-nous
          </span>
          <h2
            className="text-white"
            style={{
              fontFamily: ff.serif,
              fontSize: "clamp(2rem, 3.5vw, 3.5rem)",
              fontWeight: 700,
              lineHeight: 1.1,
              marginBottom: "1.2rem",
            }}
          >
            Prêt à rejoindre la{" "}
            <em style={{ color: "#E8A820", fontStyle: "italic" }}>dynamique CZI</em> ?
          </h2>
          <p
            className="mx-auto mb-8 max-w-[460px] text-[1rem] leading-[1.75]"
            style={{ color: "rgba(255,255,255,.5)", fontFamily: ff.body }}
          >
            Chaque action compte. Rejoignez des milliers de jeunes qui construisent un avenir plus juste.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-1 rounded-[6px] px-[1.6rem] py-[0.7rem] text-[0.74rem] font-bold uppercase tracking-[0.07em] no-underline transition-all duration-200 hover:bg-[#F5C84A]"
              style={{ background: "#E8A820", color: "#0D2550", fontFamily: ff.display }}
            >
              Créer un compte ↗
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1 rounded-[6px] border px-[1.6rem] py-[0.7rem] text-[0.74rem] font-bold uppercase tracking-[0.07em] no-underline transition-all duration-200 hover:border-[#E8A820] hover:text-[#E8A820]"
              style={{ borderColor: "rgba(255,255,255,.35)", color: "rgba(255,255,255,.85)", fontFamily: ff.display }}
            >
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
