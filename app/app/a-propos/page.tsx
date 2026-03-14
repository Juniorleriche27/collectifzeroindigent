import { Compass, Handshake, Target, Users } from "lucide-react";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const pillars = [
  {
    icon: Users,
    label: "Identité",
    value:
      "CZI est un réseau de jeunes engagés au service des ODD, organisé autour de la coopération entre acteurs de jeunesse.",
  },
  {
    icon: Handshake,
    label: "Création",
    value:
      "Le réseau a été constitué officiellement le 17 avril 2020 par 15 associations et ONG de jeunesse.",
  },
  {
    icon: Target,
    label: "Priorité",
    value:
      "La priorité stratégique est l'ODD 1, avec des actions concrètes pour l'inclusion, l'insertion et l'autonomisation.",
  },
];

const focusAreas = [
  "Citoyenneté et développement local",
  "Santé et bien-être",
  "Inclusion et droits humains",
  "Insertion professionnelle et croissance économique",
  "Climat et énergies renouvelables",
];

const axes = [
  "Autonomisation économique des jeunes et des femmes",
  "Santé communautaire et prévention",
  "Transition école-emploi",
  "Inclusion des publics vulnérables",
  "Leadership citoyen et gouvernance",
  "Résilience climatique",
  "Paix et cohésion sociale",
];

export default function AProposPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-[linear-gradient(130deg,rgba(12,111,149,0.22),rgba(46,142,99,0.16))] p-8 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">À propos</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          Collectif Zéro Indigent (CZI)
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-relaxed text-foreground/85">
          CZI est un réseau de jeunes qui mobilise la synergie d’actions pour accélérer l’atteinte des
          Objectifs de Développement Durable. Le cadre institutionnel met l’accent sur l’accompagnement,
          la formation, l’insertion et l’entrepreneuriat des jeunes.
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
          <CardTitle className="text-base">Domaines d’action</CardTitle>
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
            Axes stratégiques
          </div>
          <CardDescription className="leading-relaxed text-foreground/85">
            {axes.join(", ")}.
          </CardDescription>
        </Card>
      </section>
    </div>
  );
}
