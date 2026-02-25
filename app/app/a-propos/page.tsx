import { Compass, Handshake, Target, Users } from "lucide-react";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const pillars = [
  {
    icon: Users,
    label: "Identite",
    value:
      "CZI est un reseau de jeunes engages au service des ODD, organise autour de la cooperation entre acteurs de jeunesse.",
  },
  {
    icon: Handshake,
    label: "Constitution",
    value:
      "Le reseau est constitue officiellement le 17 avril 2020 par 15 associations et ONG de jeunesse.",
  },
  {
    icon: Target,
    label: "Priorite",
    value:
      "La priorite strategique est l ODD 1, avec des actions concretes pour l inclusion, l insertion et l autonomisation.",
  },
];

const focusAreas = [
  "Citoyennete et developpement local",
  "Sante et bien-etre",
  "Inclusion et droits humains",
  "Insertion professionnelle et croissance economique",
  "Climat et energies renouvelables",
];

const axes = [
  "Autonomisation economique des jeunes et des femmes",
  "Sante communautaire et prevention",
  "Transition ecole-emploi",
  "Inclusion des publics vulnerables",
  "Leadership citoyen et gouvernance",
  "Resilience climatique",
  "Paix et cohesion sociale",
];

export default function AProposPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-[linear-gradient(130deg,rgba(12,111,149,0.22),rgba(46,142,99,0.16))] p-8 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">A propos</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          Collectif Zero Indigent (CZI)
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-relaxed text-foreground/85">
          CZI est un reseau de jeunes qui mobilise la synergie d actions pour accelerer l atteinte
          des Objectifs de Developpement Durable. Le cadre institutionnel met l accent sur
          l accompagnement, la formation, l insertion et l entrepreneuriat des jeunes.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {pillars.map((item) => {
          const Icon = item.icon;
          return (
            <Card className="space-y-3 bg-surface/95" key={item.label}>
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Icon size={14} />
                {item.label}
              </div>
              <CardDescription className="leading-relaxed text-foreground/85">{item.value}</CardDescription>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="space-y-3 bg-surface/95">
          <CardTitle className="text-base">Domaines d action</CardTitle>
          <div className="flex flex-wrap gap-2">
            {focusAreas.map((item) => (
              <span
                className="rounded-full border border-border bg-muted-surface/80 px-3 py-1 text-sm text-foreground"
                key={item}
              >
                {item}
              </span>
            ))}
          </div>
        </Card>

        <Card className="space-y-3 bg-surface/95">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Compass size={14} />
            Axes strategiques
          </div>
          <CardDescription className="leading-relaxed text-foreground/85">
            {axes.join(", ")}.
          </CardDescription>
        </Card>
      </section>
    </div>
  );
}
