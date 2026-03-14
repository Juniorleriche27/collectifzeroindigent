import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t border-[#d2e2ee] bg-white/90">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-[#486578] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>
          © {new Date().getFullYear()} Collectif Zéro Indigent (CZI). Jeunes entrepreneurs, promoteurs des ODD.
        </p>
        <div className="flex items-center gap-4 font-semibold text-[#1b435e]">
          <Link className="transition-colors hover:text-[#0f7e8f]" href="/#accueil">
            Accueil
          </Link>
          <Link className="transition-colors hover:text-[#0f7e8f]" href="/a-propos">
            À propos
          </Link>
          <Link className="transition-colors hover:text-[#0f7e8f]" href="/login">
            Connexion
          </Link>
          <Link className="transition-colors hover:text-[#0f7e8f]" href="/signup">
            Inscription
          </Link>
        </div>
      </div>
    </footer>
  );
}

