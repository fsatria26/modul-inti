import type { DataRow, ParseResult } from "@/types/data";

export type { DataRow };

export function parseJson(text: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return {
      columns: [],
      rows: [],
      errors: [{ line: 0, expected: 0, actual: 0, message: "Format JSON tidak valid. Pastikan sintaks JSON sudah benar." }],
    };
  }

  if (!Array.isArray(parsed)) {
    return {
      columns: [],
      rows: [],
      errors: [{ line: 0, expected: 0, actual: 0, message: "Format JSON tidak valid. Pastikan file berisi array object, contoh: [{...}, {...}]." }],
    };
  }

  if (parsed.length === 0) {
    return {
      columns: [],
      rows: [],
      errors: [{ line: 0, expected: 0, actual: 0, message: "Array JSON kosong dan tidak memiliki data." }],
    };
  }

  // Validate each item is a plain object
  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i];
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return {
        columns: [],
        rows: [],
        errors: [{
          line: i + 1,
          expected: 0,
          actual: 0,
          message: `Format JSON tidak valid. Setiap item array harus berupa object. Item ke-${i + 1} bukan object.`,
        }],
      };
    }
  }

  // Collect all unique keys (union across all objects) — FR-13
  const colSet = new Set<string>();
  for (const item of parsed as Record<string, unknown>[]) {
    for (const key of Object.keys(item)) colSet.add(key);
  }
  const columns = Array.from(colSet);

  const rows: DataRow[] = (parsed as Record<string, unknown>[]).map((item) =>
    Object.fromEntries(columns.map((col) => [col, item[col] == null ? "" : String(item[col])]))
  );

  return { columns, rows, errors: [] };
}
