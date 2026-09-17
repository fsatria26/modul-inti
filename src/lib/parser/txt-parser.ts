import type { DataRow, ParseResult, ValidationError } from "@/types/data";

export type { DataRow };

/** Resolve separator: handles "TAB" keyword → actual tab char */
function resolveSep(separator: string): string {
  if (separator === "TAB" || separator === "\\t") return "\t";
  return separator || "|";
}

export function parseTxt(
  text: string,
  separator = "|",
  /** undefined = use first line as header; string[] = use these as header names */
  headers?: string[]
): ParseResult {
  const sep = resolveSep(separator);
  const rawLines = text
    .replace(/^\uFEFF/, "") // strip BOM
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "");

  if (!rawLines.length) {
    return { columns: [], rows: [], errors: [{ line: 0, expected: 0, actual: 0, message: "File TXT kosong dan tidak dapat diproses." }] };
  }

  const parsedLines = rawLines.map((line) =>
    line.split(sep).map((v) => v.trim())
  );

  let columns: string[];
  let dataStart: number;

  if (headers && headers.length > 0) {
    columns = headers;
    dataStart = 0;
  } else if (headers === undefined) {
    // Use first row as header
    columns = parsedLines[0];
    dataStart = 1;
  } else {
    // headers = [] → auto-name
    let maxCols = 0;
    for (const line of parsedLines) {
      if (line.length > maxCols) maxCols = line.length;
    }
    columns = Array.from({ length: maxCols }, (_, i) => `Kolom ${i + 1}`);
    dataStart = 0;
  }

  const errors: ValidationError[] = [];
  const rows: DataRow[] = [];

  parsedLines.slice(dataStart).forEach((values, idx) => {
    const lineNum = idx + dataStart + 1; // 1-based original line
    if (values.length !== columns.length) {
      errors.push({
        line: lineNum,
        expected: columns.length,
        actual: values.length,
        message: `Baris ${lineNum} memiliki ${values.length} kolom. Seharusnya ${columns.length} kolom.`,
      });
    }
    const row: DataRow = {};
    columns.forEach((col, i) => {
      row[col || `kolom_${i + 1}`] = values[i] ?? "";
    });
    // If extra values beyond declared columns, put them in extra cols
    for (let i = columns.length; i < values.length; i++) {
      const extraCol = `Kolom ${i + 1}`;
      row[extraCol] = values[i];
      if (!columns.includes(extraCol)) columns.push(extraCol);
    }
    rows.push(row);
  });

  return { columns, rows, errors };
}

export function countLines(text: string): number {
  return text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim() !== "").length;
}
