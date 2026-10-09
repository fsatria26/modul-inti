"use client";

import { useMemo, useState } from "react";
import FileDropzone from "@/components/FileDropzone";
import DataTableEditor from "@/components/DataTableEditor";
import JsonPreview from "@/components/JsonPreview";
import { parseTxt, countLines, detectFirstRow } from "@/lib/parser/txt-parser";
import { dataToTxt, downloadText } from "@/lib/exporter/txt-exporter";
import { downloadJson, downloadRowIndexedJson, toRowIndexedJson } from "@/lib/exporter/json-exporter";
import { validateTxtFile, formatFileSize } from "@/lib/validation/file-validation";
import type { DataRow, FileInfo, ValidationError } from "@/types/data";
import type { TxtExportConfig } from "@/types/file";

const SEPARATOR_PRESETS = [
  { label: "| (pipe)", value: "|" },
  { label: ", (koma)", value: "," },
  { label: "; (titik koma)", value: ";" },
  { label: "TAB", value: "TAB" },
];

/** Three-step page state */
type Step = "config" | "header-check" | "results";

export default function TxtToJsonPage() {
  // ── Config ────────────────────────────────────────
  const [separator, setSeparator] = useState("|");
  const [customSep, setCustomSep] = useState("");
  const [lineEnding, setLineEnding] = useState<"\r\n" | "\n">("\r\n");
  const activeSep = customSep || separator;

  // ── Step machine ──────────────────────────────────
  const [step, setStep] = useState<Step>("config");

  // ── Raw file (held between upload & parse) ────────
  const [rawText, setRawText] = useState("");
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [filename, setFilename] = useState("data");

  // ── Header detection ──────────────────────────────
  /** Values from the first row, shown for user validation */
  const [detectedFirstRow, setDetectedFirstRow] = useState<string[]>([]);
  /**
   * User's decision:
   *  - "header"  → use first row as column names
   *  - "data"    → treat first row as a data record; use col1/col2/col3 names
   *  - "custom"  → user enters column names manually
   */
  const [headerDecision, setHeaderDecision] = useState<"header" | "data" | "custom">("header");
  const [customHeaders, setCustomHeaders] = useState("");

  // ── Parse results ────────────────────────────────
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<DataRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // ── UI state ──────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");

  // ── JSON format toggle ────────────────────────────
  const [jsonFormat, setJsonFormat] = useState<"array" | "row-indexed">("array");

  // ─────────────────────────────────────────────────
  // Step 1: Upload → validate → read first row → show header check
  // ─────────────────────────────────────────────────
  async function handleFile(file: File) {
    setGlobalError("");
    const validation = validateTxtFile(file);
    if (!validation.valid) {
      setGlobalError(validation.error!);
      return;
    }

    setLoading(true);
    try {
      const text = await file.text();
      const lineCount = countLines(text);

      setRawText(text);
      setFileInfo({ name: file.name, size: file.size, lineCount, encoding: "UTF-8" });
      setFilename(file.name.replace(/\.txt$/i, ""));

      // Detect first row with current separator
      const firstRow = detectFirstRow(text, activeSep);
      setDetectedFirstRow(firstRow);

      // Reset previous results
      setColumns([]);
      setRows([]);
      setValidationErrors([]);
      setHeaderDecision("header");
      setCustomHeaders("");

      setStep("header-check");
    } finally {
      setLoading(false);
    }
  }

  // ─────────────────────────────────────────────────
  // Step 2: User confirms header decision → parse
  // ─────────────────────────────────────────────────
  function handleParse() {
    setLoading(true);
    try {
      let headers: string[] | undefined;

      if (headerDecision === "header") {
        // Use first line as header
        headers = undefined;
      } else if (headerDecision === "data") {
        // No header at all → auto col1, col2 ... and first line is data
        headers = [];
      } else {
        // Custom header names entered by user
        const sep = activeSep === "TAB" ? "\t" : activeSep;
        headers = customHeaders.split(sep).map((x) => x.trim()).filter(Boolean);
        if (headers.length === 0) {
          // Fallback to auto-naming if custom is empty
          headers = [];
        }
      }

      const result = parseTxt(rawText, activeSep, headers);
      setColumns(result.columns);
      setRows(result.rows);
      setValidationErrors(result.errors);
      setStep("results");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setStep("config");
    setRawText("");
    setFileInfo(null);
    setDetectedFirstRow([]);
    setColumns([]);
    setRows([]);
    setValidationErrors([]);
    setGlobalError("");
  }

  // ── Memos ─────────────────────────────────────────
  const errorRowIndices = useMemo(() => {
    const set = new Set<number>();
    validationErrors.forEach((e) => {
      if (e.line > 0) set.add(e.line - 1);
    });
    return set;
  }, [validationErrors]);

  const exportConfig: TxtExportConfig = {
    separator: activeSep === "TAB" ? "\t" : activeSep,
    includeHeader: headerDecision === "header",
    lineEnding,
  };

  const jsonPreview = useMemo(() => {
    const slice = rows.slice(0, 100);
    if (jsonFormat === "row-indexed") {
      return JSON.stringify(toRowIndexedJson(slice), null, 2);
    }
    return JSON.stringify(slice, null, 2);
  }, [rows, jsonFormat]);

  function handleDownloadJson() {
    if (jsonFormat === "row-indexed") {
      downloadRowIndexedJson(rows, filename);
    } else {
      downloadJson(rows, filename);
    }
  }

  function handleDownloadTxt() {
    downloadText(dataToTxt(rows, columns, exportConfig), `${filename}-export.txt`);
  }

  // ─────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────
  return (
    <main className="max-w-6xl mx-auto px-5 py-8 pb-20">
      {/* Hero */}
      <section className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">TXT → Table / JSON</h1>
        <p className="text-gray-500">Upload file TXT, validasi header, parsing berdasarkan separator, edit hasilnya, kemudian export.</p>
      </section>

      {/* ── Step indicator ── */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        {(["config", "header-check", "results"] as Step[]).map((s, i) => {
          const labels: Record<Step, string> = {
            "config": "1. Konfigurasi & Upload",
            "header-check": "2. Validasi Header",
            "results": "3. Hasil & Export",
          };
          const active = step === s;
          const done =
            (s === "config" && (step === "header-check" || step === "results")) ||
            (s === "header-check" && step === "results");
          return (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <div className="w-8 h-px bg-gray-300" />}
              <div className={[
                "px-3 py-1 rounded-full text-xs font-bold border transition-colors",
                active ? "bg-blue-600 text-white border-blue-600" :
                done  ? "bg-green-100 text-green-700 border-green-300" :
                        "bg-gray-100 text-gray-400 border-gray-200",
              ].join(" ")}>
                {done ? "✓ " : ""}{labels[s]}
              </div>
            </div>
          );
        })}
      </div>

      {/* ════════════════════════════════════════════
          STEP 1: Config + Upload
      ════════════════════════════════════════════ */}
      {(step === "config" || step === "header-check") && (
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
                    disabled={step !== "config"}
                    onClick={() => { setSeparator(p.value); setCustomSep(""); }}
                    className={[
                      "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
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
                  disabled={step !== "config"}
                  value={customSep}
                  onChange={(e) => setCustomSep(e.target.value)}
                  className={[
                    "w-24 border rounded-lg px-2 py-1.5 text-xs focus:outline-none transition-colors disabled:opacity-50",
                    customSep ? "border-blue-500 ring-1 ring-blue-200" : "border-gray-300",
                  ].join(" ")}
                />
              </div>
            </div>

            {/* Line ending */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600">Line Ending (Export TXT)</label>
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
      )}

      {/* Upload — only show on step config */}
      {step === "config" && (
        <section className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 shadow-sm">
          <FileDropzone
            accept=".txt,text/plain"
            label="Upload File TXT"
            hint="Klik atau drag & drop file .txt ke sini"
            onFile={handleFile}
          />
        </section>
      )}

      {/* Error */}
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

      {/* ════════════════════════════════════════════
          STEP 2: Header Validation
      ════════════════════════════════════════════ */}
      {step === "header-check" && !loading && (
        <>
          {/* File info strip */}
          {fileInfo && (
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

          {/* Header detection panel */}
          <section className="bg-white border border-blue-200 rounded-2xl p-5 mb-4 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="text-2xl">🔍</div>
              <div>
                <h2 className="font-bold text-gray-900 mb-0.5">Validasi Header Baris Pertama</h2>
                <p className="text-sm text-gray-500">
                  Sistem mendeteksi <strong>{detectedFirstRow.length}</strong> kolom pada baris pertama file.
                  Tentukan apakah baris ini merupakan header atau data.
                </p>
              </div>
            </div>

            {/* Detected first row preview */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Baris pertama yang terdeteksi:
              </p>
              <div className="flex gap-2 flex-wrap">
                {detectedFirstRow.map((val, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-gray-300 text-sm font-mono text-gray-800"
                  >
                    <span className="text-xs text-gray-400 font-sans">[{i + 1}]</span>
                    {val || <em className="text-gray-400">(kosong)</em>}
                  </span>
                ))}
              </div>
            </div>

            {/* Decision radio group */}
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">
              Apakah baris ini merupakan header?
            </p>
            <div className="flex flex-col gap-3 mb-5">
              {/* Option A: use as header */}
              <label className={[
                "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors",
                headerDecision === "header"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-blue-200",
              ].join(" ")}>
                <input
                  type="radio"
                  name="headerDecision"
                  value="header"
                  checked={headerDecision === "header"}
                  onChange={() => setHeaderDecision("header")}
                  className="mt-0.5 accent-blue-600"
                />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Ya — gunakan sebagai header</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Nilai baris pertama ({detectedFirstRow.join(", ")}) akan digunakan sebagai nama kolom.
                    Baris pertama tidak akan masuk sebagai data.
                  </p>
                  {headerDecision === "header" && (
                    <div className="mt-2 flex gap-1.5 flex-wrap">
                      {detectedFirstRow.map((v, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-mono font-semibold">
                          {v || `col${i + 1}`}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </label>

              {/* Option B: treat as data, auto-name cols */}
              <label className={[
                "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors",
                headerDecision === "data"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-blue-200",
              ].join(" ")}>
                <input
                  type="radio"
                  name="headerDecision"
                  value="data"
                  checked={headerDecision === "data"}
                  onChange={() => setHeaderDecision("data")}
                  className="mt-0.5 accent-blue-600"
                />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Tidak — baris ini adalah data, bukan header</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Kolom diberi nama otomatis: <span className="font-mono">col1, col2, col3…</span>.
                    Baris pertama akan ikut masuk sebagai record data.
                  </p>
                  {headerDecision === "data" && (
                    <div className="mt-2 flex gap-1.5 flex-wrap">
                      {detectedFirstRow.map((_, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-gray-200 text-gray-700 text-xs font-mono font-semibold">
                          col{i + 1}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </label>

              {/* Option C: custom column names */}
              <label className={[
                "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors",
                headerDecision === "custom"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-blue-200",
              ].join(" ")}>
                <input
                  type="radio"
                  name="headerDecision"
                  value="custom"
                  checked={headerDecision === "custom"}
                  onChange={() => setHeaderDecision("custom")}
                  className="mt-0.5 accent-blue-600"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">Tidak — dan saya ingin menentukan nama kolom sendiri</p>
                  <p className="text-xs text-gray-500 mt-0.5 mb-2">
                    Masukkan nama kolom dipisah dengan separator yang dipilih ({activeSep === "TAB" ? "TAB" : `"${activeSep}"`}).
                    Baris pertama akan ikut masuk sebagai record data.
                  </p>
                  {headerDecision === "custom" && (
                    <input
                      autoFocus
                      value={customHeaders}
                      onChange={(e) => setCustomHeaders(e.target.value)}
                      placeholder={`nim${activeSep === "TAB" ? "\t" : activeSep}nama${activeSep === "TAB" ? "\t" : activeSep}prodi`}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 font-mono"
                    />
                  )}
                </div>
              </label>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleParse}
                disabled={loading || (headerDecision === "custom" && !customHeaders.trim())}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ✓ Proses File
              </button>
              <button
                onClick={handleReset}
                className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition-colors"
              >
                ↩ Ganti File
              </button>
            </div>
          </section>
        </>
      )}

      {/* ════════════════════════════════════════════
          STEP 3: Results
      ════════════════════════════════════════════ */}
      {step === "results" && !loading && (
        <>
          {/* File + result info strip */}
          <div className="flex gap-3 flex-wrap mb-4">
            {[
              { label: "File", value: fileInfo?.name ?? "—" },
              { label: "Ukuran", value: fileInfo ? formatFileSize(fileInfo.size) : "—" },
              { label: "Kolom", value: String(columns.length) },
              { label: "Record", value: rows.length.toLocaleString("id-ID") },
              ...(validationErrors.length > 0
                ? [{ label: "⚠ Error Baris", value: String(validationErrors.length) }]
                : []),
            ].map((stat) => (
              <div
                key={stat.label}
                className={[
                  "border rounded-xl px-4 py-2.5 shadow-sm",
                  stat.label.startsWith("⚠")
                    ? "bg-red-50 border-red-200"
                    : "bg-white border-gray-200",
                ].join(" ")}
              >
                <span className={`text-xs block ${stat.label.startsWith("⚠") ? "text-red-500" : "text-gray-500"}`}>
                  {stat.label}
                </span>
                <strong className={`text-sm ${stat.label.startsWith("⚠") ? "text-red-700" : "text-gray-900"}`}>
                  {stat.value}
                </strong>
              </div>
            ))}

            <button
              onClick={handleReset}
              className="ml-auto self-center px-4 py-2 rounded-xl bg-gray-100 text-gray-600 font-semibold text-sm hover:bg-gray-200 transition-colors"
            >
              ↩ Upload Ulang
            </button>
          </div>

          {/* Data table */}
          <section className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 shadow-sm">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="font-bold text-gray-900">Data Table</h2>
              <div className="flex gap-2 flex-wrap">
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

          {/* JSON preview with format toggle */}
          <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            {/* Format toggle */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Format JSON:</span>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setJsonFormat("array")}
                  className={[
                    "px-3 py-1.5 rounded-md text-xs font-bold transition-colors",
                    jsonFormat === "array"
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700",
                  ].join(" ")}
                >
                  Array <span className="font-mono text-[10px]">[&#123;&#125;]</span>
                </button>
                <button
                  onClick={() => setJsonFormat("row-indexed")}
                  className={[
                    "px-3 py-1.5 rounded-md text-xs font-bold transition-colors",
                    jsonFormat === "row-indexed"
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700",
                  ].join(" ")}
                >
                  Row-indexed <span className="font-mono text-[10px]">&#123;row1&#125;</span>
                </button>
              </div>
              {jsonFormat === "row-indexed" && (
                <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
                  Format: &#123;&quot;row1&quot;: &#123;…&#125;, &quot;row2&quot;: &#123;…&#125;&#125;
                </span>
              )}
              {jsonFormat === "array" && (
                <span className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded px-2 py-0.5">
                  Format: [&#123;…&#125;, &#123;…&#125;]
                </span>
              )}
            </div>

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