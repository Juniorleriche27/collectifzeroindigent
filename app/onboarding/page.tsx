import { Card, CardDescription, CardTitle } from "@/components/ui/card";

import { OnboardingForm } from "./onboarding-form";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10">
      <Card>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          Etape obligatoire
        </p>
        <CardTitle className="mt-2">Onboarding membre</CardTitle>
        <CardDescription className="mt-2">
          Creation du membre puis association automatique a votre profil.
        </CardDescription>
        <OnboardingForm />
      </Card>
    </main>
  );
}
