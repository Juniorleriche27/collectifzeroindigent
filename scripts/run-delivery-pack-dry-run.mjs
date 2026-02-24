import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

const PACK_SQL_PATH = path.resolve("sql/2026-02-23_delivery_pack.sql");
const VERIFY_SQL_PATH = path.resolve("sql/2026-02-23_delivery_pack_verification.sql");

function parseArgs(argv) {
  const args = {
    reportPath: "",
    skipPack: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--skip-pack") {
      args.skipPack = true;
      continue;
    }
    if (token === "--report") {
      args.reportPath = argv[index + 1] ?? "";
      index += 1;
      continue;
    }
  }

  return args;
}

function getDatabaseUrl() {
  const value =
    process.env.SUPABASE_DB_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL;

  if (!value) {
    throw new Error(
      "Missing DB URL. Set SUPABASE_DB_URL (recommended) or DATABASE_URL.",
    );
  }

  return value;
}

function ensureFileExists(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing file: ${filePath}`);
  }
}

function toResultArray(result) {
  if (Array.isArray(result)) return result;
  if (!result) return [];
  return [result];
}

function buildDefaultReportPath() {
  const now = new Date();
  const stamp = now.toISOString().replace(/[:.]/g, "-");
  return path.resolve(`dry-run-report-${stamp}.json`);
}

async function runSql(client, sqlText) {
  const raw = await client.query({ text: sqlText, simple: true });
  return toResultArray(raw).map((entry, idx) => ({
    command: entry.command ?? "UNKNOWN",
    fields: entry.fields?.map((field) => field.name) ?? [],
    index: idx,
    rowCount: entry.rowCount ?? null,
    rows: entry.rows ?? [],
  }));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  ensureFileExists(PACK_SQL_PATH);
  ensureFileExists(VERIFY_SQL_PATH);

  const dbUrl = getDatabaseUrl();
  const reportPath = options.reportPath
    ? path.resolve(options.reportPath)
    : buildDefaultReportPath();

  const packSql = fs.readFileSync(PACK_SQL_PATH, "utf8");
  const verifySql = fs.readFileSync(VERIFY_SQL_PATH, "utf8");

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  const report = {
    generated_at: new Date().toISOString(),
    pack_file: PACK_SQL_PATH,
    skip_pack: options.skipPack,
    verify_file: VERIFY_SQL_PATH,
  };

  await client.connect();

  try {
    if (!options.skipPack) {
      const packStart = Date.now();
      const packResults = await runSql(client, packSql);
      report.pack_duration_ms = Date.now() - packStart;
      report.pack_results = packResults.map((result) => ({
        command: result.command,
        index: result.index,
        rowCount: result.rowCount,
      }));
    } else {
      report.pack_duration_ms = 0;
      report.pack_results = [];
    }

    const verifyStart = Date.now();
    const verifyResults = await runSql(client, verifySql);
    report.verify_duration_ms = Date.now() - verifyStart;
    report.verify_results = verifyResults;
  } finally {
    await client.end();
  }

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");

  console.log("DRY_RUN_DONE");
  console.log(`REPORT_PATH=${reportPath}`);
  console.log(`PACK_EXECUTED=${options.skipPack ? "false" : "true"}`);
}

main().catch((error) => {
  console.error(`DRY_RUN_FAIL: ${error.message}`);
  process.exit(1);
});

