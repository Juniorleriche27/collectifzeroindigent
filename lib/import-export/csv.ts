export type CsvRow = Record<string, string>;

export const MULTI_VALUE_DELIMITER = " | ";

export function escapeCsv(value: string | null | undefined): string {
  const safeValue = value ?? "";
  if (/[",\n\r;]/.test(safeValue)) {
    return `"${safeValue.replaceAll('"', '""')}"`;
  }
  return safeValue;
}

export function stringifyCsv(headers: string[], rows: CsvRow[]): string {
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header] ?? "")).join(",")),
  ].join("\n");
}

export function joinMultiValue(values: string[] | null | undefined): string {
  const normalized = (values ?? []).map((value) => value.trim()).filter(Boolean);
  return normalized.join(MULTI_VALUE_DELIMITER);
}

export function splitMultiValue(raw: string | null | undefined): string[] {
  return Array.from(
    new Set(
      String(raw ?? "")
        .split("|")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

export function parseCsvDocument(input: string): CsvRow[] {
  const normalizedInput = input.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let currentCell = "";
  let currentRow: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < normalizedInput.length; index += 1) {
    const char = normalizedInput[index] ?? "";
    const nextChar = normalizedInput[index + 1] ?? "";

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === ",") {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      currentRow.push(currentCell);
      currentCell = "";
      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      continue;
    }

    currentCell += char;
  }

  currentRow.push(currentCell);
  if (currentRow.some((cell) => cell.length > 0)) {
    rows.push(currentRow);
  }

  const [headerRow, ...dataRows] = rows;
  if (!headerRow || headerRow.length === 0) {
    return [];
  }

  return dataRows
    .filter((row) => row.some((cell) => cell.trim().length > 0))
    .map((row) => {
      const record: CsvRow = {};
      for (let columnIndex = 0; columnIndex < headerRow.length; columnIndex += 1) {
        const header = headerRow[columnIndex]?.trim() ?? "";
        if (!header) {
          continue;
        }
        record[header] = row[columnIndex] ?? "";
      }
      return record;
    });
}
