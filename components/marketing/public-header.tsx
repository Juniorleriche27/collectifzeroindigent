import Image from "next/image";
import Link from "next/link";

type PublicHeaderProps = {
  showAboutLink?: boolean;
};

export function PublicHeader({ showAboutLink = true }: PublicHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/30 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link className="flex items-center gap-3" href="/">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-[0_12px_30px_rgba(15,40,58,0.12)] ring-1 ring-[#d5e6f3]">
            <Image
              alt="Logo CZI"
              className="h-9 w-9 rounded-xl object-contain"
              height={36}
              src="/brand/czi-logo.jpeg"
              width={36}
            />
          </span>
          <span className="leading-tight">
            <span className="block text-lg font-extrabold tracking-tight text-[#0f2a40]">CZI</span>
            <span className="block text-xs font-medium uppercase tracking-[0.12em] text-[#4f7086]">
              Collectif Zéro Indigent
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-semibold text-[#173f5a] lg:flex">
          <Link className="transition-colors hover:text-[#0f7e8f]" href="/#accueil">
            Accueil
          </Link>
          <Link className="transition-colors hover:text-[#0f7e8f]" href="/#apropos">
            À propos
          </Link>
          <Link className="transition-colors hover:text-[#0f7e8f]" href="/#axes">
            Axes
          </Link>
          <Link className="transition-colors hover:text-[#0f7e8f]" href="/#galerie">
            Galerie
          </Link>
          {showAboutLink ? (
            <Link className="transition-colors hover:text-[#0f7e8f]" href="/a-propos">
              En savoir plus
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            className="rounded-full border border-[#c8dbea] px-4 py-2 text-sm font-semibold text-[#153a54] transition hover:bg-white"
            href="/login"
          >
            Connexion
          </Link>
          <Link
            className="rounded-full bg-[#0f7e8f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0c6673]"
            href="/signup"
          >
            Inscription
          </Link>
          <Link
            className="hidden rounded-full bg-[#f2b705] px-4 py-2 text-sm font-bold text-[#17303f] transition hover:bg-[#deaa05] sm:inline-flex"
            href="/app/dashboard"
          >
            Plateforme
          </Link>
        </div>
      </div>
    </header>
  );
}
