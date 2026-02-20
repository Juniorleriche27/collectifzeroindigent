import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

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

function parseCsv(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = lines[0].split(",").map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((value) => value.trim());
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

function normalizeKey(value) {
  return normalizeText(value).toLocaleLowerCase("fr-FR");
}

function normalizePrefectureCode(value) {
  const parsed = Number.parseInt(String(value ?? "").replace(".0", ""), 10);
  return Number.isNaN(parsed) ? normalizeText(value) : String(parsed);
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
  const regionNames = [...new Set(rows.map((row) => normalizeText(row.region)).filter(Boolean))];

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

  const existingByPair = new Map(
    (existing ?? []).map((pref) => [
      `${normalizeKey(pref.name)}::${pref.region_id}`,
      pref.id,
    ]),
  );

  const prefectureUuidByCsvCode = new Map();
  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = normalizeText(row.prefecture);
    const regionName = normalizeKey(row.region);
    const csvCode = normalizePrefectureCode(row.prefecture_id);
    const regionId = regionIdByName.get(regionName);

    if (!name || !regionId || !csvCode) {
      skipped += 1;
      continue;
    }

    const pairKey = `${normalizeKey(name)}::${regionId}`;
    const existingId = existingByPair.get(pairKey);

    if (existingId) {
      prefectureUuidByCsvCode.set(csvCode, existingId);
      continue;
    }

    const { data, error } = await supabase
      .from("prefecture")
      .insert({ name, region_id: regionId })
      .select("id")
      .single();
    if (error) throw error;

    existingByPair.set(pairKey, data.id);
    prefectureUuidByCsvCode.set(csvCode, data.id);
    inserted += 1;
  }

  return { inserted, skipped, prefectureUuidByCsvCode };
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
    const name = normalizeText(row.commune);
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
