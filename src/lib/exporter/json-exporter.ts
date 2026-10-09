import type { DataRow } from "@/types/data";
import { downloadText } from "./txt-exporter";

/** Standard array format: [{...}, {...}] */
export function downloadJson(rows: DataRow[], filename: string): void {
  downloadText(
    JSON.stringify(rows, null, 2),
    `${filename}.json`,
    "application/json;charset=utf-8"
  );
}

/**
 * Row-indexed format:
 * {
 *   "row1": { "col1": "001", "col2": "budi", ... },
 *   "row2": { "col1": "002", "col2": "adi",  ... }
 * }
 */
export function toRowIndexedJson(rows: DataRow[]): Record<string, DataRow> {
  return Object.fromEntries(rows.map((row, i) => [`row${i + 1}`, row]));
}

export function downloadRowIndexedJson(rows: DataRow[], filename: string): void {
  downloadText(
    JSON.stringify(toRowIndexedJson(rows), null, 2),
    `${filename}.json`,
    "application/json;charset=utf-8"
  );
}
