import { listDonations, type DonationStatus } from "@/lib/backend/api";
import { isSupabaseConfigured } from "@/lib/supabase/config";

import { DonsClient } from "./dons-client";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function paramValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

function parseStatus(value: string): DonationStatus | undefined {
  if (
    value === "pledged" ||
    value === "pending" ||
    value === "paid" ||
    value === "failed" ||
    value === "cancelled" ||
    value === "refunded"
  ) {
    return value;
  }
  return undefined;
}

export default async function DonsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = paramValue(params.q).trim();
  const status = parseStatus(paramValue(params.status).trim().toLowerCase());

  let loadError: string | null = null;
  let items: Awaited<ReturnType<typeof listDonations>>["items"] = [];
  let canManage = false;
  let role: string | null = null;
  let summary: Awaited<ReturnType<typeof listDonations>>["summary"] = {
    count: 0,
    paid_amount_cfa: 0,
    paid_count: 0,
    pending_count: 0,
    total_amount_cfa: 0,
  };

  if (isSupabaseConfigured) {
    try {
      const donationData = await listDonations({
        q: query || undefined,
        status,
      });
      items = donationData.items;
      canManage = donationData.can_manage;
      role = donationData.role;
      summary = donationData.summary;
    } catch (error) {
      console.error("Unable to load donations", error);
      loadError = error instanceof Error ? error.message : "Impossible de charger les dons.";
    }
  } else {
    loadError = "Supabase non configure.";
  }

  return (
    <DonsClient
      canManage={canManage}
      initialQuery={query}
      initialStatus={status ?? "all"}
      items={items}
      loadError={loadError}
      role={role}
      summary={summary}
    />
  );
}

