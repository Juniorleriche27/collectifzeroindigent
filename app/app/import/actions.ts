"use server";

import { revalidatePath } from "next/cache";

import { parseCsvDocument, type CsvRow } from "@/lib/import-export/csv";
import {
  buildOnboardingImportPayload,
  createLocationLookups,
} from "@/lib/onboarding/sheet";
import { createClient } from "@/lib/supabase/server";

export type ImportOnboardingState = {
  error: string | null;
  message: string | null;
  report: Array<{ detail: string; row: number; status: "error" | "success" }>;
  summary: {
    errors: number;
    processed: number;
    succeeded: number;
  } | null;
};

const initialState: ImportOnboardingState = {
  error: null,
  message: null,
  report: [],
  summary: null,
};

function normalizeImportError(message: string): string {
  return message.trim() || "Import onboarding impossible.";
}

function parseJsonRows(raw: string): CsvRow[] {
  const parsed = JSON.parse(raw) as unknown;

  if (Array.isArray(parsed)) {
    return parsed.filter((item): item is CsvRow => Boolean(item) && typeof item === "object");
  }

  if (parsed && typeof parsed === "object" && Array.isArray((parsed as { rows?: unknown }).rows)) {
    return (parsed as { rows: unknown[] }).rows.filter(
      (item): item is CsvRow => Boolean(item) && typeof item === "object",
    );
  }

  return [];
}

async function findVisibleMemberId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  lookup: { email: string | null; id: string | null; phone: string | null },
): Promise<string | null> {
  if (lookup.id) {
    const { data, error } = await supabase.from("member").select("id").eq("id", lookup.id).maybeSingle();
    if (error) {
      throw error;
    }
    if (data?.id) {
      return data.id;
    }
  }

  if (lookup.email) {
    const { data, error } = await supabase
      .from("member")
      .select("id")
      .eq("email", lookup.email)
      .maybeSingle();
    if (error) {
      throw error;
    }
    if (data?.id) {
      return data.id;
    }
  }

  if (lookup.phone) {
    const { data, error } = await supabase
      .from("member")
      .select("id")
      .eq("phone", lookup.phone)
      .maybeSingle();
    if (error) {
      throw error;
    }
    if (data?.id) {
      return data.id;
    }
  }

  return null;
}

export async function importOnboardingSheet(
  _previousState: ImportOnboardingState = initialState,
  formData: FormData,
): Promise<ImportOnboardingState> {
  void _previousState;

  const uploadedFile = formData.get("file");
  if (!(uploadedFile instanceof File) || uploadedFile.size === 0) {
    return {
      ...initialState,
      error: "Choisissez un fichier CSV ou JSON d'onboarding à importer.",
    };
  }

  try {
    const rawText = await uploadedFile.text();
    const extension = uploadedFile.name.toLowerCase().split(".").pop() ?? "";
    const rows =
      extension === "json" ? parseJsonRows(rawText) : parseCsvDocument(rawText);

    if (rows.length === 0) {
      return {
        ...initialState,
        error: "Le fichier importé est vide ou illisible.",
      };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        ...initialState,
        error: "Session invalide. Reconnectez-vous.",
      };
    }

    const [regionsResult, prefecturesResult, communesResult] = await Promise.all([
      supabase.from("region").select("id, name"),
      supabase.from("prefecture").select("id, name"),
      supabase.from("commune").select("id, name"),
    ]);

    if (regionsResult.error) throw regionsResult.error;
    if (prefecturesResult.error) throw prefecturesResult.error;
    if (communesResult.error) throw communesResult.error;

    const locationLookups = createLocationLookups({
      communes: communesResult.data ?? [],
      prefectures: prefecturesResult.data ?? [],
      regions: regionsResult.data ?? [],
    });

    const report: ImportOnboardingState["report"] = [];
    let succeeded = 0;

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const rowNumber = rowIndex + 2;
      const row = rows[rowIndex] ?? {};
      const prepared = buildOnboardingImportPayload(row, locationLookups);

      if (prepared.error || !prepared.payload) {
        report.push({
          detail: prepared.error ?? "Ligne invalide.",
          row: rowNumber,
          status: "error",
        });
        continue;
      }

      try {
        const memberId = await findVisibleMemberId(supabase, prepared.memberLookup);
        if (!memberId) {
          report.push({
            detail: "Aucun membre visible ne correspond à cette ligne.",
            row: rowNumber,
            status: "error",
          });
          continue;
        }

        const { error: updateError } = await supabase
          .from("member")
          .update(prepared.payload)
          .eq("id", memberId);

        if (updateError) {
          report.push({
            detail: updateError.message,
            row: rowNumber,
            status: "error",
          });
          continue;
        }

        succeeded += 1;
        report.push({
          detail: `Fiche mise à jour pour le membre ${memberId}.`,
          row: rowNumber,
          status: "success",
        });
      } catch (error) {
        report.push({
          detail: error instanceof Error ? error.message : "Erreur inconnue pendant l'import.",
          row: rowNumber,
          status: "error",
        });
      }
    }

    revalidatePath("/app/export");
    revalidatePath("/app/import");
    revalidatePath("/app/membres");

    const errors = report.filter((item) => item.status === "error").length;

    return {
      error: errors > 0 && succeeded === 0 ? "Aucune ligne n'a pu être importée." : null,
      message:
        succeeded > 0
          ? `${succeeded} fiche(s) onboarding importée(s) avec ${errors} erreur(s).`
          : null,
      report,
      summary: {
        errors,
        processed: rows.length,
        succeeded,
      },
    };
  } catch (error) {
    return {
      ...initialState,
      error: normalizeImportError(
        error instanceof Error ? error.message : "Import onboarding impossible.",
      ),
    };
  }
}
