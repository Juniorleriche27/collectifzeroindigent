import { NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

type ExportMemberRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
  region_id: string | null;
  prefecture_id: string | null;
  commune_id: string | null;
  join_mode: string | null;
  org_name: string | null;
  cellule_primary: string | null;
  cellule_secondary: string | null;
  photo_status: string | null;
  photo_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function escapeCsv(value: string | null | undefined): string {
  const safeValue = value ?? "";
  if (/[",\n;]/.test(safeValue)) {
    return `"${safeValue.replaceAll('"', '""')}"`;
  }
  return safeValue;
}

function filenameFor(format: "csv" | "json"): string {
  const stamp = new Date().toISOString().replaceAll(":", "-").slice(0, 19);
  return `czi-membres-${stamp}.${format}`;
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
        "id, first_name, last_name, email, phone, status, region_id, prefecture_id, commune_id, join_mode, org_name, cellule_primary, cellule_secondary, photo_status, photo_url, created_at, updated_at",
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

  const regionsById = new Map((regionsResult.data ?? []).map((item) => [String(item.id), item.name]));
  const prefecturesById = new Map(
    (prefecturesResult.data ?? []).map((item) => [String(item.id), item.name]),
  );
  const communesById = new Map((communesResult.data ?? []).map((item) => [String(item.id), item.name]));

  const rows = ((membersResult.data ?? []) as ExportMemberRow[]).map((member) => ({
    cellule_principale: member.cellule_primary ?? "",
    cellule_secondaire: member.cellule_secondary ?? "",
    commune: communesById.get(String(member.commune_id)) ?? "",
    cree_le: member.created_at ?? "",
    email: member.email ?? "",
    id: member.id,
    mis_a_jour_le: member.updated_at ?? "",
    mode_inscription: member.join_mode ?? "",
    nom: member.last_name ?? "",
    organisation: member.org_name ?? "",
    photo_statut: member.photo_status ?? "",
    photo_url: member.photo_url ?? "",
    prefecture: prefecturesById.get(String(member.prefecture_id)) ?? "",
    prenom: member.first_name ?? "",
    region: regionsById.get(String(member.region_id)) ?? "",
    statut: member.status ?? "",
    telephone: member.phone ?? "",
  }));

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

    const headers = [
      "id",
      "prenom",
      "nom",
      "email",
      "telephone",
      "statut",
      "region",
      "prefecture",
      "commune",
      "mode_inscription",
      "organisation",
      "cellule_principale",
      "cellule_secondaire",
      "photo_statut",
      "photo_url",
      "cree_le",
      "mis_a_jour_le",
    ];

    const csvContent = [
      headers.join(","),
      ...result.rows.map((row) =>
        headers.map((header) => escapeCsv(String(row[header as keyof typeof row] ?? ""))).join(","),
      ),
    ].join("\n");

    return new Response(csvContent, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${filenameFor("csv")}"`,
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Impossible de generer l'export des membres.";
    return new Response(message, { status: 500 });
  }
}
