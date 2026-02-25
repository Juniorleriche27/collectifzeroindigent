import { listSupportAiHistory } from "@/lib/backend/api";

import { SupportClient } from "./support-client";

export default async function SupportPage() {
  let items = [] as Awaited<ReturnType<typeof listSupportAiHistory>>["items"];
  let disclaimer =
    "Assistant IA informatif uniquement: ne remplace pas un avis juridique, medical ou financier professionnel.";
  let dailyLimit = 0;
  let remainingToday = 0;
  let usedToday = 0;
  let loadError: string | null = null;

  try {
    const response = await listSupportAiHistory(30);
    items = response.items;
    disclaimer = response.disclaimer;
    dailyLimit = response.daily_limit;
    remainingToday = response.remaining_today;
    usedToday = response.used_today;
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Erreur chargement support IA.";
  }

  return (
    <SupportClient
      dailyLimit={dailyLimit}
      disclaimer={disclaimer}
      items={items}
      loadError={loadError}
      remainingToday={remainingToday}
      usedToday={usedToday}
    />
  );
}
