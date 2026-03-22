import { NextRequest } from "next/server";

import { stringifyCsv, type CsvRow } from "@/lib/import-export/csv";
import { buildXlsxBuffer, XLSX_MIME_TYPE } from "@/lib/import-export/xlsx";
import { createClient } from "@/lib/supabase/server";

const MEMBER_EXPORT_HEADERS = [
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
] as const;

function filenameFor(format: "csv" | "json" | "xlsx"): string {
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

  const rows: CsvRow[] = (membersResult.data ?? []).map((member) => ({
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
  const requestedFormat = request.nextUrl.searchParams.get("format");
  const format: "csv" | "json" | "xlsx" =
    requestedFormat === "json" ? "json" : requestedFormat === "xlsx" ? "xlsx" : "csv";

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

    if (format === "xlsx") {
      const buffer = buildXlsxBuffer({
        headers: [...MEMBER_EXPORT_HEADERS],
        rows: result.rows,
        sheetName: "Membres",
      });

      return new Response(buffer, {
        headers: {
          "Cache-Control": "no-store",
          "Content-Disposition": `attachment; filename="${filenameFor("xlsx")}"`,
          "Content-Type": XLSX_MIME_TYPE,
        },
      });
    }

    const csvContent = stringifyCsv([...MEMBER_EXPORT_HEADERS], result.rows);

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
