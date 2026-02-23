import Link from "next/link";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const pages = [
  { href: "/login", label: "Login", description: "Connexion utilisateur" },
  { href: "/signup", label: "Signup", description: "Inscription utilisateur" },
  { href: "/onboarding", label: "Onboarding", description: "Creation du profil membre" },
  { href: "/app/dashboard", label: "Tableau de bord", description: "Accueil espace membre" },
  { href: "/app/membres", label: "Membres", description: "Liste et recherche" },
  { href: "/app/membres/demo", label: "Detail membre", description: "Fiche membre editable" },
  { href: "/app/organisations", label: "Organisations", description: "Cartes + modal creation" },
  { href: "/app/communiques", label: "Communiques", description: "Annonces ciblees CZI" },
  { href: "/app/communaute", label: "Communaute", description: "Canaux + messagerie privee" },
  { href: "/app/campagnes-email", label: "Campagnes email", description: "Envoi en masse cible" },
  { href: "/app/parametres", label: "Parametres", description: "Tabs compte/securite/notifications/roles" },
  { href: "/app/profils", label: "Profils", description: "Placeholder en cours de dev" },
  { href: "/app/support", label: "Support", description: "Centre d'aide" },
  { href: "/app/import-export", label: "Import/Export", description: "Hub import/export" },
  { href: "/app/import", label: "Import", description: "Import simple" },
  { href: "/app/export", label: "Export", description: "Export simple" },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-12">
      <div className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">CZI MVP</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Bootstrap Navigation</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Point d&apos;entree provisoire pour naviguer rapidement entre les ecrans du MVP.
        </p>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pages.map((page) => (
          <Link key={page.href} href={page.href}>
            <Card className="h-full transition-transform hover:-translate-y-0.5 hover:shadow-lg">
              <CardTitle>{page.label}</CardTitle>
              <CardDescription className="mt-2">{page.description}</CardDescription>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-primary">
                {page.href}
              </p>
            </Card>
          </Link>
        ))}
      </section>
    </main>
  );
}
