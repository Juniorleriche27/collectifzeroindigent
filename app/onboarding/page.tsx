import { redirect } from "next/navigation";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getCurrentMember, getLocations } from "@/lib/backend/api";
import { requireUser } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  let disabledReason: string | undefined;
  let defaultEmail: string | undefined;
  let regions: Array<{ id: string; name: string }> = [];
  let prefectures: Array<{ id: string; name: string; region_id: string }> = [];
  let communes: Array<{ id: string; name: string; prefecture_id: string }> = [];

  if (isSupabaseConfigured) {
    const user = await requireUser();
    defaultEmail = user.email;

    let canLoadLocations = true;
    try {
      const member = await getCurrentMember();
      if (member) {
        redirect("/app/dashboard");
      }
    } catch {
      canLoadLocations = false;
      disabledReason =
        "Impossible de verifier votre profil membre via l'API backend. " +
        "Verifiez que le backend tourne sur le bon port.";
    }

    if (canLoadLocations) {
      try {
        const locationData = await getLocations();
        regions = locationData.regions;
        prefectures = locationData.prefectures;
        communes = locationData.communes;
        if (regions.length === 0 || prefectures.length === 0 || communes.length === 0) {
          disabledReason =
            "Configuration territoriale incomplete (region/prefecture/commune). " +
            "Ajoutez ces donnees dans Supabase avant de terminer l'onboarding.";
        }
      } catch (error) {
        console.error("Unable to load onboarding locations", error);
        disabledReason = "Impossible de charger region/prefecture/commune pour le moment.";
      }
    }
  } else {
    disabledReason =
      "Supabase non configure. Ajoutez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY.";
  }

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

        <OnboardingForm
          communes={communes}
          defaultEmail={defaultEmail}
          disabledReason={disabledReason}
          prefectures={prefectures}
          regions={regions}
        />
      </Card>
    </main>
  );
}
