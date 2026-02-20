import { createClient } from "@/lib/supabase/server";

type DbErrorLike = {
  code?: string;
  message?: string;
};

export type OrganisationCardItem = {
  id: string;
  name: string;
  category: string;
  members: number;
};

export type OrganisationSource = "organisation_table" | "organization_table" | "member_derived";

export type OrganisationListResult = {
  canCreate: boolean;
  items: OrganisationCardItem[];
  note: string | null;
  source: OrganisationSource;
};

export type CreateOrganisationResult =
  | { ok: true; source: "organisation" | "organization" }
  | { error: string; ok: false; unsupported: boolean };

const missingRelationCodes = new Set(["42P01", "PGRST205"]);
const unknownColumnCodes = new Set(["42703"]);
const notNullCodes = new Set(["23502"]);

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function countValue(value: unknown): number {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) return 0;
  return Math.floor(numberValue);
}

function errorCode(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  return String((error as DbErrorLike).code ?? "");
}

function errorMessage(error: unknown): string {
  if (!error || typeof error !== "object") return "Erreur inconnue.";
  return String((error as DbErrorLike).message ?? "Erreur inconnue.");
}

function hasCode(error: unknown, set: Set<string>): boolean {
  return set.has(errorCode(error));
}

function normalizeCategory(value: string): string {
  if (value === "association") return "Association";
  if (value === "enterprise") return "Entreprise";
  if (value === "personal") return "Personnel";
  return value ? value[0].toUpperCase() + value.slice(1) : "Organisation";
}

function mapOrganisationRows(rows: Record<string, unknown>[]): OrganisationCardItem[] {
  const items = rows
    .map((row, index) => {
      const name =
        text(row.name) ||
        text(row.org_name) ||
        text(row.organization_name) ||
        text(row.organisation_name) ||
        text(row.title) ||
        text(row.label);

      if (!name) return null;

      const categoryRaw =
        text(row.type) || text(row.category) || text(row.profile_type) || "organisation";
      const members =
        countValue(row.member_count) ||
        countValue(row.members_count) ||
        countValue(row.members) ||
        countValue(row.total_members);

      return {
        category: normalizeCategory(categoryRaw.toLowerCase()),
        id: text(row.id) || text(row.uuid) || `${name.toLowerCase().replaceAll(" ", "-")}-${index}`,
        members,
        name,
      };
    })
    .filter((item): item is OrganisationCardItem => Boolean(item));

  return items.sort((first, second) => {
    if (second.members !== first.members) {
      return second.members - first.members;
    }
    return first.name.localeCompare(second.name, "fr");
  });
}

async function queryOrganisationTable(
  tableName: "organisation" | "organization",
): Promise<{ error?: string; items?: OrganisationCardItem[]; missing: boolean }> {
  const supabase = await createClient();
  const { data, error } = await supabase.from(tableName).select("*").limit(200);

  if (error) {
    if (hasCode(error, missingRelationCodes)) {
      return { missing: true };
    }
    return {
      error: errorMessage(error),
      missing: false,
    };
  }

  return {
    items: mapOrganisationRows((data ?? []) as Record<string, unknown>[]),
    missing: false,
  };
}

async function deriveOrganisationsFromMembers(): Promise<OrganisationCardItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("member")
    .select("id, join_mode, org_name, association_name, enterprise_name");

  if (error) {
    throw new Error(error.message);
  }

  const grouped = new Map<string, OrganisationCardItem>();
  for (const row of (data ?? []) as Record<string, unknown>[]) {
    const joinMode = text(row.join_mode).toLowerCase();
    const associationName = text(row.association_name);
    const enterpriseName = text(row.enterprise_name);
    const orgName = text(row.org_name);
    const name = associationName || enterpriseName || orgName;

    if (!name || (joinMode && joinMode === "personal")) {
      continue;
    }

    const key = name.toLowerCase();
    const category =
      associationName || joinMode === "association"
        ? "Association"
        : enterpriseName || joinMode === "enterprise"
          ? "Entreprise"
          : "Organisation";

    const existing = grouped.get(key);
    if (existing) {
      existing.members += 1;
      continue;
    }

    grouped.set(key, {
      category,
      id: text(row.id) || `${key.replaceAll(" ", "-")}-0`,
      members: 1,
      name,
    });
  }

  return Array.from(grouped.values()).sort((first, second) => {
    if (second.members !== first.members) {
      return second.members - first.members;
    }
    return first.name.localeCompare(second.name, "fr");
  });
}

export async function listOrganisations(filters?: {
  search?: string;
}): Promise<OrganisationListResult> {
  const firstTable = await queryOrganisationTable("organisation");
  if (!firstTable.missing && firstTable.items) {
    const search = text(filters?.search).toLowerCase();
    const items = search
      ? firstTable.items.filter((item) =>
          `${item.name} ${item.category}`.toLowerCase().includes(search),
        )
      : firstTable.items;

    return {
      canCreate: true,
      items,
      note: null,
      source: "organisation_table",
    };
  }

  const secondTable = await queryOrganisationTable("organization");
  if (!secondTable.missing && secondTable.items) {
    const search = text(filters?.search).toLowerCase();
    const items = search
      ? secondTable.items.filter((item) =>
          `${item.name} ${item.category}`.toLowerCase().includes(search),
        )
      : secondTable.items;

    return {
      canCreate: true,
      items,
      note: null,
      source: "organization_table",
    };
  }

  if (firstTable.error && !firstTable.missing) {
    throw new Error(firstTable.error);
  }
  if (secondTable.error && !secondTable.missing) {
    throw new Error(secondTable.error);
  }

  const search = text(filters?.search).toLowerCase();
  const derivedItems = await deriveOrganisationsFromMembers();
  const items = search
    ? derivedItems.filter((item) => `${item.name} ${item.category}`.toLowerCase().includes(search))
    : derivedItems;

  return {
    canCreate: false,
    items,
    note: "Aucune table organisations detectee. Donnees derivees depuis public.member.",
    source: "member_derived",
  };
}

async function tryInsertIntoTable(
  tableName: "organisation" | "organization",
  payloads: Record<string, unknown>[],
): Promise<{ error?: string; missing: boolean; success: boolean }> {
  const supabase = await createClient();
  let lastSchemaError: string | null = null;

  for (const payload of payloads) {
    const { error } = await supabase.from(tableName).insert(payload);
    if (!error) {
      return { missing: false, success: true };
    }

    if (hasCode(error, missingRelationCodes)) {
      return { missing: true, success: false };
    }

    if (hasCode(error, unknownColumnCodes) || hasCode(error, notNullCodes)) {
      lastSchemaError = errorMessage(error);
      continue;
    }

    return {
      error: errorMessage(error),
      missing: false,
      success: false,
    };
  }

  if (lastSchemaError) {
    return {
      error:
        "Table organisations detectee mais schema incompatible avec l'insertion MVP. " +
        `Detail: ${lastSchemaError}`,
      missing: false,
      success: false,
    };
  }

  return {
    error: "Impossible de creer l'organisation.",
    missing: false,
    success: false,
  };
}

export async function createOrganisationRecord(input: {
  name: string;
  type: "association" | "enterprise";
}): Promise<CreateOrganisationResult> {
  const name = text(input.name);
  if (!name) {
    return {
      error: "Le nom de l'organisation est obligatoire.",
      ok: false,
      unsupported: false,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error: "Session invalide. Reconnectez-vous.",
      ok: false,
      unsupported: false,
    };
  }

  const payloads = [
    { category: input.type, name },
    { name, type: input.type },
    { org_name: name, profile_type: input.type },
    { title: name, type: input.type },
    { name },
  ];

  const firstInsert = await tryInsertIntoTable("organisation", payloads);
  if (firstInsert.success) {
    return { ok: true, source: "organisation" };
  }
  if (!firstInsert.missing && firstInsert.error) {
    return { error: firstInsert.error, ok: false, unsupported: false };
  }

  const secondInsert = await tryInsertIntoTable("organization", payloads);
  if (secondInsert.success) {
    return { ok: true, source: "organization" };
  }
  if (!secondInsert.missing && secondInsert.error) {
    return { error: secondInsert.error, ok: false, unsupported: false };
  }

  return {
    error: "Aucune table organisation/organization detectee pour l'insertion.",
    ok: false,
    unsupported: true,
  };
}
