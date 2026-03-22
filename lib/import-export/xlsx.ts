import * as XLSX from "xlsx";

import type { CsvRow } from "./csv";

export const XLSX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export function buildXlsxBuffer(args: {
  headers: string[];
  rows: CsvRow[];
  sheetName?: string;
}): ArrayBuffer {
  const sheetData = [
    args.headers,
    ...args.rows.map((row) => args.headers.map((header) => row[header] ?? "")),
  ];
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

  XLSX.utils.book_append_sheet(workbook, worksheet, args.sheetName ?? "Export");

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer;
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
}

export function parseXlsxRows(input: ArrayBuffer): CsvRow[] {
  const workbook = XLSX.read(input, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return [];
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
  });

  return rows.map((row) => {
    const normalized: CsvRow = {};
    for (const [key, value] of Object.entries(row)) {
      normalized[String(key)] = typeof value === "string" ? value : String(value ?? "");
    }
    return normalized;
  });
}
