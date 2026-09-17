"use client";

import { useState } from "react";
import FileDropzone from "@/components/FileDropzone";
import TxtPreview from "@/components/TxtPreview";
import { parseJson } from "@/lib/parser/json-parser";
import { dataToTxt, downloadText } from "@/lib/exporter/txt-exporter";
import { validateJsonFile, formatFileSize } from "@/lib/validation/file-validation";
import type { DataRow, FileInfo } from "@/types/data";
import type { TxtExportConfig } from "@/types/file";

const SEPARATOR_PRESETS = [
  { label: "| (pipe)", value: "|" },
  { label: ", (koma)", value: "," },
  { label: "; (titik koma)", value: ";" },
  { label: "TAB", value: "TAB" },
];

export default function JsonToTxtPage() {
  const [separator, setSeparator] = useState("|");
  const [customSep, setCustomSep] = useState("");
  const [includeHeader, setIncludeHeader] = useState(true);
  const [lineEnding, setLineEnding] = useState<"\r\n" | "\n">("\r\n");

  const [rows, setRows] = useState<DataRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [filename, setFilename] = useState("data");

  const activeSep = customSep || separator;

  async function handleFile(file: File) {
    setError("");
    setRows([]);
    setColumns([]);
    setFileInfo(null);

    const validation = validateJsonFile(file);
    if (!validation.valid) {
      setError(validation.error!);
      return;
    }

    setLoading(true);
    try {
      const text = await file.text();
      const result = parseJson(text);
      if (result.errors.length > 0) {
        setError(result.errors[0].message);
        return;
      }
      setColumns(result.columns);
      setRows(result.rows);
      setFileInfo({ name: file.name, size: file.size, lineCount: result.rows.length });
      setFilename(file.name.replace(/\.json$/i, ""));
    } finally {
      setLoading(false);
    }
  }

  const exportConfig: TxtExportConfig = {
    separator: activeSep === "TAB" ? "\t" : activeSep,
    includeHeader,
    lineEnding,
  };

  function handleDownloadTxt() {
    downloadText(dataToTxt(rows, columns, exportConfig), `${filename}.txt`);
  }

  const txtPreview = dataToTxt(rows.slice(0, 100), columns, exportConfig);

  return (
    <main className="max-w-6xl mx-auto px-5 py-8 pb-20">
      {/* Hero */}
      <section className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">JSON → TXT</h1>
        <p className="text-gray-500">Upload JSON array of objects, pilih separator dan konfigurasi header, lalu download sebagai TXT.</p>
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

          {/* Header */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-600">Header</label>
            <select
              value={includeHeader ? "yes" : "no"}
              onChange={(e) => setIncludeHeader(e.target.value === "yes")}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400"
            >
              <option value="yes">Sertakan baris header</option>
              <option value="no">Tanpa header</option>
            </select>
          </div>

          {/* Line ending */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-600">Line Ending</label>
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
          accept=".json,application/json"
          label="Upload File JSON"
          hint="JSON harus berupa array of objects: [{…}, {…}]"
          onFile={handleFile}
        />
      </section>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">
          ❌ {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-xl px-4 py-3 mb-4 text-sm animate-pulse">
          ⏳ Memvalidasi JSON…
        </div>
      )}

      {/* File info */}
      {fileInfo && !loading && (
        <div className="flex gap-3 flex-wrap mb-4">
          {[
            { label: "File", value: fileInfo.name },
            { label: "Ukuran", value: formatFileSize(fileInfo.size) },
            { label: "Record", value: fileInfo.lineCount?.toLocaleString("id-ID") ?? "—" },
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
          </div>

          {/* Preview table */}
          <section className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-900">Preview Data</h2>
              <button
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors"
                onClick={handleDownloadTxt}
              >
                ⬇ Download TXT
              </button>
            </div>
            <div className="overflow-auto rounded-xl border border-gray-200">
              <table className="border-collapse w-full min-w-[500px] bg-white text-sm">
                <thead>
                  <tr>
                    {columns.map((c) => (
                      <th key={c} className="bg-gray-50 border-b border-gray-200 px-3 py-2 text-left text-xs font-bold text-gray-700">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 100).map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      {columns.map((c) => (
                        <td key={c} className="border-b border-gray-100 px-3 py-2 text-gray-800">
                          {row[c]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 100 && (
              <p className="text-xs text-gray-500 mt-2">Preview dibatasi 100 record. Export tetap mencakup seluruh {rows.length.toLocaleString("id-ID")} record.</p>
            )}
          </section>

          {/* TXT preview */}
          <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <TxtPreview text={txtPreview} totalCount={rows.length} previewLimit={100} />
          </section>
        </>
      )}
    </main>
  );
}