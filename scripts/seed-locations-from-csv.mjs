import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const GRAND_LOME_REGION = "Grand Lomé";
const GRAND_LOME_PREFECTURE_CODES = new Set(["32", "35"]);
const GRAND_LOME_PREFECTURE_NAMES = new Set([
  "agoe nyive",
  "agoe-nyive",
  "agoè-nyivé",
  "golfe",
]);

function loadDotEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf8");
  return Object.fromEntries(
    content
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const idx = line.indexOf("=");
        const key = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim();
        return [key, value];
      }),
  );
}

function splitCsvLine(line, delimiter) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let idx = 0; idx < line.length; idx += 1) {
    const char = line[idx];
    const next = line[idx + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      idx += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function parseCsv(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];
  const delimiter = lines[0].includes(";") ? ";" : ",";
  const headers = splitCsvLine(lines[0], delimiter).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line, delimiter).map((value) => value.trim());
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] ?? "";
    });
    return row;
  });
}

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function stripDiacritics(value) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function normalizeKey(value) {
  return stripDiacritics(value)
    .replace(/[’'`]/g, "")
    .replace(/[-_]/g, " ")
    .toLocaleLowerCase("fr-FR")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePrefectureCode(value) {
  const parsed = Number.parseInt(String(value ?? "").replace(".0", ""), 10);
  return Number.isNaN(parsed) ? normalizeText(value) : String(parsed);
}

function sanitizeCommuneName(value) {
  return normalizeText(value)
    .replace(/\s*[-–—]\s*maire.*$/i, "")
    .replace(/\s*\(.*maire.*\)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveRegionNameForPrefecture({
  csvCode,
  prefectureName,
  rowRegionName,
}) {
  const regionName = normalizeText(rowRegionName);
  const regionKey = normalizeKey(regionName);
  const prefectureKey = normalizeKey(prefectureName);

  if (regionKey === normalizeKey(GRAND_LOME_REGION)) {
    return GRAND_LOME_REGION;
  }

  if (GRAND_LOME_PREFECTURE_CODES.has(csvCode)) {
    return GRAND_LOME_REGION;
  }

  if (
    GRAND_LOME_PREFECTURE_NAMES.has(prefectureKey) &&
    regionKey === normalizeKey("Maritime")
  ) {
    return GRAND_LOME_REGION;
  }

  return regionName;
}

const envFromFile = {
  ...loadDotEnvFile(path.resolve(".env.local")),
  ...loadDotEnvFile(path.resolve(".env")),
};

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? envFromFile.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  envFromFile.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const regionsCsvPath = path.resolve("togo_regions.csv");
const prefecturesCsvPath = path.resolve("togo_prefectures.csv");
const communesCsvPath = path.resolve("togo_communes.csv");

for (const file of [regionsCsvPath, prefecturesCsvPath, communesCsvPath]) {
  if (!fs.existsSync(file)) {
    throw new Error(`CSV file not found: ${file}`);
  }
}

async function seedRegions() {
  const rows = parseCsv(regionsCsvPath);
  const regionNames = new Set(
    rows.map((row) => normalizeText(row.region)).filter(Boolean),
  );
  regionNames.add(GRAND_LOME_REGION);

  const { data: existing, error: existingError } = await supabase
    .from("region")
    .select("id, name");
  if (existingError) throw existingError;

  const existingByName = new Map(
    (existing ?? []).map((region) => [normalizeKey(region.name), region]),
  );

  let inserted = 0;
  for (const name of regionNames) {
    const key = normalizeKey(name);
    if (existingByName.has(key)) continue;

    const { data, error } = await supabase
      .from("region")
      .insert({ name })
      .select("id, name")
      .single();
    if (error) throw error;

    existingByName.set(key, data);
    inserted += 1;
  }

  return {
    inserted,
    regionIdByName: new Map(
      [...existingByName.entries()].map(([key, value]) => [key, value.id]),
    ),
  };
}

async function seedPrefectures(regionIdByName) {
  const rows = parseCsv(prefecturesCsvPath);

  const { data: existing, error: existingError } = await supabase
    .from("prefecture")
    .select("id, name, region_id");
  if (existingError) throw existingError;

  const existingRows = existing ?? [];
  const existingByPair = new Map();
  const existingByName = new Map();
  for (const pref of existingRows) {
    const nameKey = normalizeKey(pref.name);
    const pairKey = `${nameKey}::${pref.region_id}`;
    existingByPair.set(pairKey, pref.id);
    const list = existingByName.get(nameKey) ?? [];
    list.push({ id: pref.id, region_id: pref.region_id });
    existingByName.set(nameKey, list);
  }

  const prefectureUuidByCsvCode = new Map();
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = normalizeText(row.prefecture);
    const csvCode = normalizePrefectureCode(row.prefecture_id);
    const resolvedRegionName = resolveRegionNameForPrefecture({
      csvCode,
      prefectureName: name,
      rowRegionName: row.region,
    });
    const regionId = regionIdByName.get(normalizeKey(resolvedRegionName));
    const nameKey = normalizeKey(name);

    if (!name || !regionId || !csvCode) {
      skipped += 1;
      continue;
    }

    const pairKey = `${nameKey}::${regionId}`;
    const existingId = existingByPair.get(pairKey);

    if (existingId) {
      prefectureUuidByCsvCode.set(csvCode, existingId);
      continue;
    }

    const sameNameExisting = existingByName.get(nameKey)?.[0];
    if (sameNameExisting) {
      if (sameNameExisting.region_id !== regionId) {
        const { error } = await supabase
          .from("prefecture")
          .update({ region_id: regionId })
          .eq("id", sameNameExisting.id);
        if (error) throw error;
        updated += 1;
        existingByPair.delete(`${nameKey}::${sameNameExisting.region_id}`);
        sameNameExisting.region_id = regionId;
      }
      existingByPair.set(pairKey, sameNameExisting.id);
      prefectureUuidByCsvCode.set(csvCode, sameNameExisting.id);
      continue;
    }

    const { data, error } = await supabase
      .from("prefecture")
      .insert({ name, region_id: regionId })
      .select("id")
      .single();
    if (error) throw error;

    existingByPair.set(pairKey, data.id);
    existingByName.set(nameKey, [{ id: data.id, region_id: regionId }]);
    prefectureUuidByCsvCode.set(csvCode, data.id);
    inserted += 1;
  }

  return { inserted, skipped, updated, prefectureUuidByCsvCode };
}

async function seedCommunes(prefectureUuidByCsvCode) {
  const rows = parseCsv(communesCsvPath);

  const { data: existing, error: existingError } = await supabase
    .from("commune")
    .select("id, name, prefecture_id");
  if (existingError) throw existingError;

  const existingByPair = new Set(
    (existing ?? []).map(
      (commune) =>
        `${normalizeKey(commune.name)}::${normalizeText(commune.prefecture_id)}`,
    ),
  );

  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const rawName = row.commune || row.name || row.nom_commune || "";
    const name = sanitizeCommuneName(rawName);
    const csvPrefectureCode = normalizePrefectureCode(row.prefecture_id);
    const prefectureId = prefectureUuidByCsvCode.get(csvPrefectureCode);

    if (!name || !prefectureId) {
      skipped += 1;
      continue;
    }

    const pairKey = `${normalizeKey(name)}::${prefectureId}`;
    if (existingByPair.has(pairKey)) continue;

    const { error } = await supabase
      .from("commune")
      .insert({ name, prefecture_id: prefectureId });
    if (error) throw error;

    existingByPair.add(pairKey);
    inserted += 1;
  }

  return { inserted, skipped };
}

async function readCounts() {
  const tables = ["region", "prefecture", "commune"];
  const counts = {};
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });
    if (error) throw error;
    counts[table] = count ?? 0;
  }
  return counts;
}

async function run() {
  const before = await readCounts();
  const regionResult = await seedRegions();
  const prefectureResult = await seedPrefectures(regionResult.regionIdByName);
  const communeResult = await seedCommunes(
    prefectureResult.prefectureUuidByCsvCode,
  );
  const after = await readCounts();

  console.log("Seed completed.");
  console.log(
    JSON.stringify(
      {
        before,
        inserted: {
          regions: regionResult.inserted,
          prefectures: prefectureResult.inserted,
          communes: communeResult.inserted,
          prefectures_region_remapped: prefectureResult.updated,
        },
        skipped: {
          prefectures: prefectureResult.skipped,
          communes: communeResult.skipped,
        },
        after,
      },
      null,
      2,
    ),
  );
}

run().catch((error) => {
  console.error("Seed failed:", error);
  process.exitCode = 1;
});
