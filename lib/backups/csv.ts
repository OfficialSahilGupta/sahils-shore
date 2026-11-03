// ============================================================================
// Sahil's Shore: RFC-4180 Compliant CSV Formatter
// ============================================================================

/**
 * Escapes a single CSV cell value according to RFC-4180.
 */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  let str: string;
  if (typeof value === "object") {
    str = JSON.stringify(value);
  } else {
    str = String(value);
  }

  // If cell contains commas, quotes, carriage returns, or newlines, quote it and escape internal quotes
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Converts an array of objects into an RFC-4180 CSV string with a header row.
 */
export function jsonToCsv(rows: Record<string, unknown>[]): string {
  if (!rows || rows.length === 0) {
    return "";
  }

  // Collect all unique keys from all rows to preserve column consistency
  const headerSet = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      headerSet.add(key);
    }
  }

  const headers = Array.from(headerSet);
  const csvLines: string[] = [];

  // Header row
  csvLines.push(headers.map((h) => escapeCsvCell(h)).join(","));

  // Data rows
  for (const row of rows) {
    const line = headers.map((header) => escapeCsvCell(row[header])).join(",");
    csvLines.push(line);
  }

  return csvLines.join("\r\n");
}
