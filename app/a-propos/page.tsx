import Image from "next/image";
import Link from "next/link";

import { marketingBodyFont, marketingDisplayFont } from "@/components/marketing/fonts";
import { PublicFooter } from "@/components/marketing/public-footer";
import { PublicHeader } from "@/components/marketing/public-header";

const governancePillars = [
  "Synergie d'actions entre les jeunes",
  "Orientation, formation et employabilité",
  "Innovation, entrepreneuriat et création de richesses",
  "Inclusion des filles, femmes et personnes vulnérables",
];

const targets = [
  "Jeunes",
  "Entrepreneurs",
  "Associations et mouvements de jeunes",
  "Filles et femmes",
  "Personnes en situation de handicap",
];

const domains = [
  "Citoyenneté et développement local",
  "Santé et bien-être",
  "Inclusion, sécurité et droits humains",
  "Insertion professionnelle et croissance économique",
  "Réchauffement climatique et énergies renouvelables",
];

export default function PublicAboutPage() {
  return (
    <div
      className={`${marketingDisplayFont.variable} ${marketingBodyFont.variable} min-h-screen bg-[#f6fbff] text-[#122f45]`}
    >
      <PublicHeader showAboutLink={false} />

      <main className="mx-auto w-full max-w-7xl space-y-10 px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        <section className="grid gap-8 rounded-[2rem] border border-[#cde1ef] bg-white/90 p-8 shadow-[0_20px_60px_rgba(17,43,62,0.1)] lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#3e6d87]">À propos du CZI</p>
            <h1
              className="text-4xl font-extrabold leading-tight text-[#0f2d44] sm:text-5xl"
              style={{ fontFamily: "var(--font-marketing-display), var(--font-sans), sans-serif" }}
            >
              Construire un avenir durable avec la jeunesse.
            </h1>
            <p className="text-base leading-relaxed text-[#48697f]">
              Le Collectif Zro Indigent (CZI) est un cadre dengagement citoyen et entrepreneurial fond par des
              jeunes pour des jeunes, avec pour objectif de transformer les communauts par l’innovation sociale,
              conomique et environnementale.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                className="rounded-full bg-[#0f7e8f] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#0c6673]"
                href="/signup"
              >
                Rejoindre CZI
              </Link>
              <Link
                className="rounded-full border border-[#c3d9e9] px-6 py-3 text-sm font-bold text-[#193d56] transition hover:bg-white"
                href="/"
              >
                Retour à l’accueil
              </Link>
            </div>
          </div>

          <article className="overflow-hidden rounded-3xl border border-[#d2e4f2] bg-white p-3 shadow-[0_16px_46px_rgba(18,47,67,0.16)]">
            <Image
              alt="Mobilisation CZI"
              className="h-72 w-full rounded-2xl object-cover sm:h-80"
              height={738}
              src="/brand/gallery/czi-photo-08.jpg"
              width={1970}
            />
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <article className="rounded-3xl border border-[#cde2ef] bg-white p-6 shadow-[0_12px_30px_rgba(14,43,62,0.08)] lg:col-span-2">
            <h2
              className="text-2xl font-extrabold text-[#0f2d44]"
              style={{ fontFamily: "var(--font-marketing-display), var(--font-sans), sans-serif" }}
            >
              Vision et mission
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-[#355a73]">
              <p>
                <span className="font-bold text-[#174764]">Vision:</span> contribuer, grce  la synergie dactions
                des jeunes,  l’atteinte des Objectifs de Dveloppement Durable, avec un accent sur l’ODD 1.
              </p>
              <p>
                <span className="font-bold text-[#174764]">Mission:</span> outiller, orienter et accompagner les
                jeunes pour accelerer leur insertion, promouvoir l’innovation, l’entrepreneuriat et l’impact social.
              </p>
            </div>
          </article>

          <article className="rounded-3xl border border-[#cde2ef] bg-[#f8fcff] p-6 shadow-[0_12px_30px_rgba(14,43,62,0.06)]">
            <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[#3d6a84]">Cibles prioritaires</h3>
            <ul className="mt-4 space-y-2 text-sm text-[#2f566f]">
              {targets.map((target) => (
                <li className="rounded-xl border border-[#d5e6f1] bg-white px-3 py-2" key={target}>
                  {target}
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-[#cde2ef] bg-white p-6 shadow-[0_12px_30px_rgba(14,43,62,0.08)]">
            <h3
              className="text-2xl font-extrabold text-[#0f2d44]"
              style={{ fontFamily: "var(--font-marketing-display), var(--font-sans), sans-serif" }}
            >
              Fondamentaux CZI
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-[#355a73]">
              {governancePillars.map((pillar) => (
                <li className="rounded-xl border border-[#d4e5f1] bg-[#f9fdff] px-3 py-2" key={pillar}>
                  {pillar}
                </li>
              ))}
            </ul>
          </article>
          <article className="rounded-3xl border border-[#cde2ef] bg-white p-6 shadow-[0_12px_30px_rgba(14,43,62,0.08)]">
            <h3
              className="text-2xl font-extrabold text-[#0f2d44]"
              style={{ fontFamily: "var(--font-marketing-display), var(--font-sans), sans-serif" }}
            >
              Domaines d intervention
            </h3>
            <ul className="mt-4 grid gap-3 text-sm text-[#355a73]">
              {domains.map((domain) => (
                <li className="rounded-xl border border-[#d4e5f1] bg-[#f9fdff] px-3 py-2" key={domain}>
                  {domain}
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {["/brand/gallery/czi-photo-01.jpg", "/brand/gallery/czi-photo-02.jpg", "/brand/gallery/czi-photo-06.jpg"].map(
            (src) => (
              <article
                className="overflow-hidden rounded-3xl border border-[#d0e3f0] bg-white p-3 shadow-[0_14px_36px_rgba(17,42,61,0.1)]"
                key={src}
              >
                <Image
                  alt="Activités CZI"
                  className="h-56 w-full rounded-2xl object-cover"
                  height={960}
                  src={src}
                  width={1400}
                />
              </article>
            ),
          )}
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

