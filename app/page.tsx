import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { marketingBodyFont, marketingDisplayFont } from "@/components/marketing/fonts";
import { PublicFooter } from "@/components/marketing/public-footer";
import { PublicHeader } from "@/components/marketing/public-header";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type GalleryItem = {
  alt: string;
  src: string;
};

const impactFigures = [
  { label: "Vision", value: "ODD 1", detail: "Contribuer a eliminer l extreme pauvrete et la faim." },
  { label: "Annee de creation", value: "2020", detail: "Collectif fonde le 17 avril 2020." },
  { label: "Axe structurants", value: "07", detail: "Insertion, inclusion, climat, paix, leadership..." },
];

const strategicAxes = [
  "Promouvoir l'autonomisation economique des femmes et des jeunes.",
  "Contribuer a l'amelioration de la sante des populations.",
  "Faciliter la transition ecole-marche du travail des jeunes.",
  "Promouvoir des mecanismes d'inclusion pour les publics vulnerables.",
  "Renforcer l'engagement citoyen, le leadership et la bonne gouvernance.",
  "Developper la resilience face au rechauffement climatique.",
  "Renforcer la collaboration Etat-jeunesse pour la paix sociale.",
];

const focusDomains = [
  "Citoyennete et developpement local",
  "Sante et bien-etre",
  "Inclusion, securite et droits humains",
  "Insertion professionnelle et croissance economique",
  "Climat et energies renouvelables",
];

const gallery: GalleryItem[] = [
  { src: "/brand/gallery/czi-photo-08.jpg", alt: "Grande mobilisation CZI" },
  { src: "/brand/gallery/czi-photo-01.jpg", alt: "Jeunes engages CZI" },
  { src: "/brand/gallery/czi-photo-02.jpg", alt: "Action terrain CZI" },
  { src: "/brand/gallery/czi-photo-03.jpg", alt: "Programme social CZI" },
  { src: "/brand/gallery/czi-photo-04.jpg", alt: "Equipe locale CZI" },
  { src: "/brand/gallery/czi-photo-06.jpg", alt: "Dialogue communautaire CZI" },
];

function paramValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function safeNextPath(value: string): string | null {
  const normalized = value.trim();
  if (!normalized.startsWith("/") || normalized.startsWith("//")) {
    return null;
  }
  return normalized;
}

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const code = paramValue(params.code);
  const nextPath = safeNextPath(paramValue(params.next));

  if (code) {
    const callbackParams = new URLSearchParams({ code });
    if (nextPath) {
      callbackParams.set("next", nextPath);
    }
    redirect(`/auth/callback?${callbackParams.toString()}`);
  }

  return (
    <div
      className={`${marketingDisplayFont.variable} ${marketingBodyFont.variable} min-h-screen bg-[#f3f9ff] text-[#112c43]`}
    >
      <PublicHeader />

      <main>
        <section className="relative overflow-hidden" id="accueil">
          <div className="landing-orb landing-orb--a" />
          <div className="landing-orb landing-orb--b" />
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 pb-18 pt-14 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:px-8 lg:pb-24">
            <div className="space-y-8">
              <p className="inline-flex items-center rounded-full border border-[#c7deee] bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#2f5e7b]">
                Collectif Zero Indigent
              </p>
              <div className="space-y-5">
                <h1
                  className="max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-tight text-[#0d2a41] sm:text-5xl lg:text-6xl"
                  style={{ fontFamily: "var(--font-marketing-display), var(--font-sans), sans-serif" }}
                >
                  Jeunes entrepreneurs,
                  <span className="block text-[#0e8b8f]">promoteurs des ODD.</span>
                </h1>
                <p
                  className="max-w-2xl text-base leading-relaxed text-[#3f5f73] sm:text-lg"
                  style={{ fontFamily: "var(--font-marketing-body), var(--font-sans), sans-serif" }}
                >
                  CZI mobilise la jeunesse, les associations et les entrepreneurs autour d une ambition claire:
                  transformer l engagement citoyen en impact concret pour les communautes.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  className="rounded-full bg-[#0f7e8f] px-6 py-3 text-sm font-bold text-white shadow-[0_14px_36px_rgba(9,77,95,0.28)] transition hover:-translate-y-0.5 hover:bg-[#0b6873]"
                  href="/signup"
                >
                  Rejoindre le collectif
                </Link>
                <Link
                  className="rounded-full border border-[#bbd4e7] bg-white/90 px-6 py-3 text-sm font-bold text-[#153a54] transition hover:-translate-y-0.5 hover:bg-white"
                  href="/login"
                >
                  Se connecter
                </Link>
                <Link
                  className="rounded-full border border-transparent px-3 py-3 text-sm font-bold text-[#1b4d67] underline-offset-4 transition hover:underline"
                  href="/app/dashboard"
                >
                  Acceder a la plateforme
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {impactFigures.map((item) => (
                  <article
                    className="rounded-2xl border border-[#c9ddea] bg-white/80 p-4 shadow-[0_16px_40px_rgba(16,44,67,0.06)]"
                    key={item.label}
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#4c6f85]">{item.label}</p>
                    <p className="mt-2 text-3xl font-extrabold text-[#0f2a40]">{item.value}</p>
                    <p className="mt-1 text-sm text-[#58788f]">{item.detail}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="landing-float grid gap-4 sm:grid-cols-2">
                <article className="relative overflow-hidden rounded-3xl border border-[#d1e5f2] bg-white p-3 shadow-[0_18px_44px_rgba(18,45,65,0.14)] sm:col-span-2">
                  <Image
                    alt="Mobilisation nationale CZI"
                    className="h-52 w-full rounded-2xl object-cover sm:h-72"
                    height={738}
                    src="/brand/gallery/czi-photo-08.jpg"
                    width={1970}
                  />
                </article>
                <article className="relative overflow-hidden rounded-3xl border border-[#d1e5f2] bg-white p-3 shadow-[0_18px_40px_rgba(18,45,65,0.12)]">
                  <Image
                    alt="Actions communautaires CZI"
                    className="h-44 w-full rounded-2xl object-cover sm:h-52"
                    height={960}
                    src="/brand/gallery/czi-photo-02.jpg"
                    width={1372}
                  />
                </article>
                <article className="relative overflow-hidden rounded-3xl border border-[#d1e5f2] bg-white p-3 shadow-[0_18px_40px_rgba(18,45,65,0.12)]">
                  <Image
                    alt="Programme social CZI"
                    className="h-44 w-full rounded-2xl object-cover sm:h-52"
                    height={814}
                    src="/brand/gallery/czi-photo-03.jpg"
                    width={1334}
                  />
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8" id="apropos">
          <div className="grid gap-10 rounded-[2rem] border border-[#cbe0ee] bg-white/85 p-8 shadow-[0_30px_70px_rgba(18,45,65,0.08)] lg:grid-cols-[0.92fr_1.08fr]">
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#3d6a86]">A propos du CZI</p>
              <h2
                className="text-3xl font-extrabold leading-tight text-[#102e46] sm:text-4xl"
                style={{ fontFamily: "var(--font-marketing-display), var(--font-sans), sans-serif" }}
              >
                Une jeunesse qui agit pour des communautes plus resilientes.
              </h2>
              <p className="text-base leading-relaxed text-[#48697f]">
                Le Collectif Zero Indigent est un reseau de jeunes, d associations et d entrepreneurs mobilises pour
                accelerer l atteinte des ODD, avec un focus prioritaire sur la lutte contre la pauvrete et
                l autonomisation durable.
              </p>
              <div className="rounded-2xl bg-[#f1f8fd] p-5">
                <p className="text-sm font-semibold text-[#1e4f68]">
                  « Faire de chaque jeune un acteur engage dans l atteinte des ODD. »
                </p>
              </div>
              <Link
                className="inline-flex rounded-full bg-[#103f65] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#0f3350]"
                href="/a-propos"
              >
                Voir la presentation complete
              </Link>
            </div>
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {focusDomains.map((domain) => (
                  <span
                    className="rounded-full border border-[#c7dcec] bg-[#f9fcff] px-3 py-1 text-xs font-semibold text-[#2f5f7a]"
                    key={domain}
                  >
                    {domain}
                  </span>
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <article className="rounded-2xl border border-[#c9ddec] bg-[#f9fdff] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#507086]">La vision</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#2b5067]">
                    Contribuer, grace a la synergie d actions des jeunes, a l atteinte des ODD.
                  </p>
                </article>
                <article className="rounded-2xl border border-[#c9ddec] bg-[#f9fdff] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#507086]">La mission</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#2b5067]">
                    Outiller, orienter et accompagner la jeunesse vers l insertion et l impact local.
                  </p>
                </article>
                <article className="rounded-2xl border border-[#c9ddec] bg-[#f9fdff] p-4 sm:col-span-2">
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#507086]">Cibles prioritaires</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#2b5067]">
                    Jeunes, entrepreneurs, associations de jeunesse, filles et femmes, personnes en situation de
                    handicap.
                  </p>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8" id="axes">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#3d6a86]">Priorites CZI</p>
              <h2
                className="mt-1 text-3xl font-extrabold text-[#0f2a40] sm:text-4xl"
                style={{ fontFamily: "var(--font-marketing-display), var(--font-sans), sans-serif" }}
              >
                Les 07 axes strategiques
              </h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {strategicAxes.map((axis, index) => (
              <article
                className="rounded-2xl border border-[#cbe0ef] bg-white/85 p-5 shadow-[0_16px_40px_rgba(15,42,62,0.07)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(15,42,62,0.12)]"
                key={axis}
              >
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#0f7e8f]">Axe {index + 1}</p>
                <p className="mt-2 text-sm leading-relaxed text-[#2a5068]">{axis}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8" id="galerie">
          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#3d6a86]">Galerie</p>
            <h2
              className="mt-1 text-3xl font-extrabold text-[#0f2a40] sm:text-4xl"
              style={{ fontFamily: "var(--font-marketing-display), var(--font-sans), sans-serif" }}
            >
              Le CZI en images
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {gallery.map((item) => (
              <article
                className="group overflow-hidden rounded-3xl border border-[#cde2f1] bg-white p-3 shadow-[0_18px_42px_rgba(16,42,62,0.09)]"
                key={item.src}
              >
                <Image
                  alt={item.alt}
                  className="h-64 w-full rounded-2xl object-cover transition duration-500 group-hover:scale-105"
                  height={960}
                  src={item.src}
                  width={1400}
                />
              </article>
            ))}
          </div>
        </section>

        <section className="pb-18">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-[2rem] border border-[#c9deee] bg-gradient-to-r from-[#0f2f47] via-[#0f4f68] to-[#0f7e8f] px-8 py-10 text-white shadow-[0_24px_62px_rgba(13,38,57,0.36)]">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#b8deeb]">Agir ensemble</p>
              <h3
                className="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl"
                style={{ fontFamily: "var(--font-marketing-display), var(--font-sans), sans-serif" }}
              >
                Rejoignez la dynamique CZI et transformez votre engagement en impact.
              </h3>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  className="rounded-full bg-[#f2b705] px-6 py-3 text-sm font-extrabold text-[#183445] transition hover:bg-[#dea904]"
                  href="/signup"
                >
                  Creer un compte
                </Link>
                <Link
                  className="rounded-full border border-white/50 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-white/10"
                  href="/login"
                >
                  Connexion membre
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />

      <style>{`
        @keyframes landing-float {
          0% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0); }
        }
        @keyframes landing-pulse {
          0% { transform: scale(1); opacity: 0.35; }
          50% { transform: scale(1.1); opacity: 0.55; }
          100% { transform: scale(1); opacity: 0.35; }
        }
        .landing-float {
          animation: landing-float 7s ease-in-out infinite;
        }
        .landing-orb {
          pointer-events: none;
          position: absolute;
          border-radius: 9999px;
          filter: blur(2px);
          animation: landing-pulse 8s ease-in-out infinite;
        }
        .landing-orb--a {
          height: 280px;
          width: 280px;
          left: -70px;
          top: 22px;
          background: radial-gradient(circle, rgba(9,156,165,0.32), rgba(9,156,165,0.02));
        }
        .landing-orb--b {
          height: 360px;
          width: 360px;
          right: -110px;
          top: 45%;
          background: radial-gradient(circle, rgba(242,183,5,0.26), rgba(242,183,5,0.02));
          animation-delay: 0.9s;
        }
      `}</style>
    </div>
  );
}

