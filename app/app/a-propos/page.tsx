import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const fundamentals = [
  {
    title: "Creation",
    value:
      "Lance en septembre 2019, officiellement fonde le 17 avril 2020 par 15 associations et ONG.",
  },
  {
    title: "Vision",
    value:
      "Contribuer, grace a la synergie d actions des jeunes, a l atteinte des ODD, en priorite l ODD 1.",
  },
  {
    title: "Slogan",
    value: "Faire de chaque jeune un acteur engage dans l atteinte des ODD.",
  },
];

const missions = [
  "Creer une synergie de reflexion et d actions entre les jeunes.",
  "Fournir des outils d orientation et de formation pour l insertion professionnelle.",
  "Promouvoir la creativite, l innovation et l esprit d entreprise.",
];

const targets = [
  "Les jeunes",
  "Les entrepreneurs",
  "Les associations et mouvements de jeunes",
  "Les filles et les femmes",
  "Les personnes en situation de handicap",
];

const domains = [
  "Citoyennete et developpement local",
  "Sante et bien-etre",
  "Inclusion, securite et droits humains",
  "Insertion professionnelle et croissance economique",
  "Rechauffement climatique et energies renouvelables",
];

const strategicAxes = [
  "Autonomisation economique des femmes et des jeunes.",
  "Sante des populations et lutte contre les maladies.",
  "Transition ecole-marche du travail des jeunes.",
  "Inclusion des filles, femmes et personnes vivant avec un handicap.",
  "Engagement citoyen, leadership et bonne gouvernance.",
  "Resilience climatique et adaptation des zones vulnerables.",
  "Collaboration Etat-jeunesse pour la paix et la cohesion sociale.",
];

export default function AProposPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">A propos</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">Collectif Zero Indigent (CZI)</h2>
        <CardDescription className="mt-2">
          Presentation institutionnelle basee sur le dossier CZI 2024.
        </CardDescription>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {fundamentals.map((item) => (
          <Card className="space-y-2" key={item.title}>
            <CardTitle className="text-base">{item.title}</CardTitle>
            <CardDescription>{item.value}</CardDescription>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <CardTitle className="text-base">Mission</CardTitle>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {missions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
        <Card className="space-y-3">
          <CardTitle className="text-base">Cibles prioritaires</CardTitle>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {targets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <CardTitle className="text-base">Domaines d intervention</CardTitle>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {domains.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
        <Card className="space-y-3">
          <CardTitle className="text-base">7 axes strategiques</CardTitle>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {strategicAxes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}

