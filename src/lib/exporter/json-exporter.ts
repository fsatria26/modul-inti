import type { DataRow } from "@/types/data";
import { downloadText } from "./txt-exporter";

export function downloadJson(rows: DataRow[], filename: string): void {
  downloadText(
    JSON.stringify(rows, null, 2),
    `${filename}.json`,
    "application/json;charset=utf-8"
  );
}
