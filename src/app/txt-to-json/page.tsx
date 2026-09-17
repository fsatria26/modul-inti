"use client";

import { useMemo, useState } from "react";
import FileDropzone from "@/components/FileDropzone";
import DataTableEditor from "@/components/DataTableEditor";
import JsonPreview from "@/components/JsonPreview";
import { parseTxt, countLines } from "@/lib/parser/txt-parser";
import { dataToTxt, downloadText } from "@/lib/exporter/txt-exporter";
import { downloadJson } from "@/lib/exporter/json-exporter";
import { validateTxtFile, formatFileSize } from "@/lib/validation/file-validation";
import type { DataRow, FileInfo, ValidationError } from "@/types/data";
import type { TxtExportConfig } from "@/types/file";

const SEPARATOR_PRESETS = [
  { label: "| (pipe)", value: "|" },
  { label: ", (koma)", value: "," },
  { label: "; (titik koma)", value: ";" },
  { label: "TAB", value: "TAB" },
];

export default function TxtToJsonPage() {
  const [separator, setSeparator] = useState("|");
  const [customSep, setCustomSep] = useState("");
  const [hasHeader, setHasHeader] = useState(true);
  const [customHeaders, setCustomHeaders] = useState("");
  const [lineEnding, setLineEnding] = useState<"\r\n" | "\n">("\r\n");

  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<DataRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [filename, setFilename] = useState("data");

  const activeSep = customSep || separator;

  async function handleFile(file: File) {
    setGlobalError("");
    const validation = validateTxtFile(file);
    if (!validation.valid) {
      setGlobalError(validation.error!);
      setColumns([]); setRows([]); setValidationErrors([]); setFileInfo(null);
      return;
    }

    setLoading(true);
    try {
      const text = await file.text();
      const lineCount = countLines(text);
      setFileInfo({ name: file.name, size: file.size, lineCount, encoding: "UTF-8" });
      setFilename(file.name.replace(/\.txt$/i, ""));

      const headers = hasHeader
        ? undefined
        : customHeaders.split(activeSep === "TAB" ? "\t" : activeSep)
            .map((x) => x.trim())
            .filter(Boolean);

      const result = parseTxt(text, activeSep, headers);
      setColumns(result.columns);
      setRows(result.rows);
      setValidationErrors(result.errors);
    } finally {
      setLoading(false);
    }
  }

  const errorRowIndices = useMemo(() => {
    const set = new Set<number>();
    validationErrors.forEach((e) => {
      if (e.line > 0) set.add(e.line - 1); // convert to 0-based data index
    });
    return set;
  }, [validationErrors]);

  const exportConfig: TxtExportConfig = {
    separator: activeSep === "TAB" ? "\t" : activeSep,
    includeHeader: hasHeader,
    lineEnding,
  };

  function handleDownloadJson() {
    downloadJson(rows, filename);
  }

  function handleDownloadTxt() {
    downloadText(dataToTxt(rows, columns, exportConfig), `${filename}-export.txt`);
  }

  const jsonPreview = useMemo(
    () => JSON.stringify(rows.slice(0, 100), null, 2),
    [rows]
  );

  return (
    <main className="max-w-6xl mx-auto px-5 py-8 pb-20">
      {/* Hero */}
      <section className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">TXT → Table / JSON</h1>
        <p className="text-gray-500">Upload file TXT, parsing berdasarkan separator, edit hasilnya, kemudian export.</p>
      </section>

      {/* Config panel */}
      <section className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Konfigurasi</h2>
        <div className="flex flex-wrap gap-5 items-end">
          {/* Separator presets */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-600">Separator</label>
            <div className="flex gap-1.5 flex-wrap">
              {SEPARATOR_PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => { setSeparator(p.value); setCustomSep(""); }}
                  className={[
                    "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
                    separator === p.value && !customSep
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-blue-400",
                  ].join(" ")}
                >
                  {p.label}
                </button>
              ))}
              <input
                placeholder="Kustom…"
                maxLength={3}
                value={customSep}
                onChange={(e) => setCustomSep(e.target.value)}
                className={[
                  "w-24 border rounded-lg px-2 py-1.5 text-xs focus:outline-none transition-colors",
                  customSep ? "border-blue-500 ring-1 ring-blue-200" : "border-gray-300",
                ].join(" ")}
              />
            </div>
          </div>

          {/* Header mode */}
          <div className="flex flex-col gap-1.5 min-w-[200px]">
            <label className="text-xs font-bold text-gray-600">Header</label>
            <select
              value={hasHeader ? "yes" : "no"}
              onChange={(e) => setHasHeader(e.target.value === "yes")}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400"
            >
              <option value="yes">Baris pertama adalah header</option>
              <option value="no">TXT tidak memiliki header</option>
            </select>
          </div>

          {/* Custom column names */}
          {!hasHeader && (
            <div className="flex flex-col gap-1.5 flex-1 min-w-[240px]">
              <label className="text-xs font-bold text-gray-600">
                Nama kolom (pisahkan dengan &quot;{activeSep === "TAB" ? "TAB" : activeSep}&quot;)
              </label>
              <input
                value={customHeaders}
                onChange={(e) => setCustomHeaders(e.target.value)}
                placeholder="nim|nama|prodi|status"
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          )}

          {/* Line ending */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-600">Line Ending (Export)</label>
            <select
              value={lineEnding}
              onChange={(e) => setLineEnding(e.target.value as "\r\n" | "\n")}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400"
            >
              <option value="\r\n">CRLF (Windows)</option>
              <option value="\n">LF (Unix/Mac)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Upload */}
      <section className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 shadow-sm">
        <FileDropzone
          accept=".txt,text/plain"
          label="Upload File TXT"
          hint="Klik atau drag & drop file .txt ke sini"
          onFile={handleFile}
        />
      </section>

      {/* Global error */}
      {globalError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">
          ❌ {globalError}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-xl px-4 py-3 mb-4 text-sm animate-pulse">
          ⏳ Memproses file…
        </div>
      )}

      {/* File info */}
      {fileInfo && !loading && (
        <div className="flex gap-3 flex-wrap mb-4">
          {[
            { label: "File", value: fileInfo.name },
            { label: "Ukuran", value: formatFileSize(fileInfo.size) },
            { label: "Baris", value: fileInfo.lineCount?.toLocaleString("id-ID") ?? "—" },
            { label: "Encoding", value: fileInfo.encoding ?? "UTF-8" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
              <span className="text-xs text-gray-500 block">{stat.label}</span>
              <strong className="text-sm text-gray-900">{stat.value}</strong>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {rows.length > 0 && !loading && (
        <>
          {/* Stats */}
          <div className="flex gap-3 flex-wrap mb-4">
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
              <span className="text-xs text-gray-500 block">Kolom</span>
              <strong className="text-lg text-gray-900">{columns.length}</strong>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
              <span className="text-xs text-gray-500 block">Record</span>
              <strong className="text-lg text-gray-900">{rows.length.toLocaleString("id-ID")}</strong>
            </div>
            {validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 shadow-sm">
                <span className="text-xs text-red-500 block">Error Baris</span>
                <strong className="text-lg text-red-700">{validationErrors.length}</strong>
              </div>
            )}
          </div>

          {/* Data table */}
          <section className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-900">Data Table</h2>
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors"
                  onClick={handleDownloadJson}
                >
                  ⬇ Download JSON
                </button>
                <button
                  className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 font-bold text-sm hover:bg-blue-100 transition-colors"
                  onClick={handleDownloadTxt}
                >
                  ⬇ Download TXT
                </button>
              </div>
            </div>
            <DataTableEditor
              columns={columns}
              rows={rows}
              onChange={setRows}
              errorRows={errorRowIndices}
              validationErrors={validationErrors.length > 0 ? validationErrors : undefined}
            />
          </section>

          {/* JSON preview */}
          <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <JsonPreview
              json={jsonPreview}
              totalCount={rows.length}
              previewLimit={100}
            />
          </section>
        </>
      )}
    </main>
  );
}