import type { DataRow } from "@/types/data";
import type { TxtExportConfig } from "@/types/file";

export function dataToTxt(
  rows: DataRow[],
  columns: string[],
  config: Partial<TxtExportConfig> = {}
): string {
  const sep = config.separator ?? "|";
  const eol = config.lineEnding ?? "\r\n";
  const incHeader = config.includeHeader ?? true;

  const lines: string[] = [];
  if (incHeader) lines.push(columns.join(sep));
  for (const row of rows) {
    lines.push(
      columns
        .map((col) => String(row[col] ?? "").replaceAll(sep, " "))
        .join(sep)
    );
  }
  return lines.join(eol);
}

export function downloadText(
  content: string,
  filename: string,
  mime = "text/plain;charset=utf-8"
): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
