import { Card, CardDescription, CardTitle } from "@/components/ui/card";

import { OnboardingForm } from "./onboarding-form";

export const dynamic = "force-dynamic";

export default function OnboardingPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10">
      <Card>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          Etape obligatoire
        </p>
        <CardTitle className="mt-2">Onboarding membre</CardTitle>
        <CardDescription className="mt-2">
          Fiche membre complete: identite, localisation, orientation CZI et besoins.
        </CardDescription>
        <OnboardingForm />
      </Card>
    </main>
  );
}
