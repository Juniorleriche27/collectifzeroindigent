import { NextRequest } from "next/server";

import { stringifyCsv } from "@/lib/import-export/csv";
import {
  buildOnboardingSheetRow,
  createLocationLabels,
  ONBOARDING_SHEET_HEADERS,
  type SheetMemberRow,
} from "@/lib/onboarding/sheet";
import { createClient } from "@/lib/supabase/server";

function filenameFor(format: "csv" | "json"): string {
  const stamp = new Date().toISOString().replaceAll(":", "-").slice(0, 19);
  return `czi-onboarding-${stamp}.${format}`;
}

async function loadExportRows() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }
  if (!user) {
    return { rows: [], unauthorized: true as const };
  }

  const [membersResult, regionsResult, prefecturesResult, communesResult] = await Promise.all([
    supabase
      .from("member")
      .select(
        "id, first_name, last_name, phone, email, gender, birth_date, age_range, education_level, occupation_status, profession_title, region_id, prefecture_id, commune_id, locality, mobility, mobility_zones, join_mode, organisation_id, org_name, cellule_primary, cellule_secondary, engagement_domains, engagement_frequency, engagement_recent_action, business_stage, business_sector, business_needs, org_role, org_name_declared, skills, skills_tags, interests, interests_tags, odd_priorities, goal_3_6_months, support_types, availability, contact_preference, partner_request, org_type, consent_terms, consent_analytics, consent_ai_training_agg, income_range, income_stability, dependents_count, housing_status, food_security, health_access, savings_level, debt_level, employment_duration_if_searching, urgent_needs, recent_shock, disability_or_limitation, indigence_score, indigence_level, indigence_factors, status, created_at, updated_at",
      )
      .order("created_at", { ascending: false })
      .range(0, 4999),
    supabase.from("region").select("id, name"),
    supabase.from("prefecture").select("id, name"),
    supabase.from("commune").select("id, name"),
  ]);

  if (membersResult.error) throw membersResult.error;
  if (regionsResult.error) throw regionsResult.error;
  if (prefecturesResult.error) throw prefecturesResult.error;
  if (communesResult.error) throw communesResult.error;

  const labels = createLocationLabels({
    communes: communesResult.data ?? [],
    prefectures: prefecturesResult.data ?? [],
    regions: regionsResult.data ?? [],
  });

  const rows = ((membersResult.data ?? []) as SheetMemberRow[]).map((member) =>
    buildOnboardingSheetRow(member, labels),
  );

  return { rows, unauthorized: false as const };
}

export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get("format") === "json" ? "json" : "csv";

  try {
    const result = await loadExportRows();
    if (result.unauthorized) {
      return new Response("Session invalide. Reconnectez-vous.", { status: 401 });
    }

    if (format === "json") {
      return new Response(JSON.stringify(result.rows, null, 2), {
        headers: {
          "Cache-Control": "no-store",
          "Content-Disposition": `attachment; filename="${filenameFor("json")}"`,
          "Content-Type": "application/json; charset=utf-8",
        },
      });
    }

    const csvContent = stringifyCsv([...ONBOARDING_SHEET_HEADERS], result.rows);

    return new Response(csvContent, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${filenameFor("csv")}"`,
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Impossible de générer l'export onboarding.";
    return new Response(message, { status: 500 });
  }
}
