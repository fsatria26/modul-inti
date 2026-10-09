"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import FileDropzone from "@/components/FileDropzone";
import { validatePdfFile, formatFileSize } from "@/lib/validation/file-validation";
import type { CompilePart } from "@/types/compiler";

// Both TipTap and react-pdf require browser DOM — load client-only
const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), {
  ssr: false,
  loading: () => (
    <div className="border border-gray-200 rounded-xl min-h-[400px] flex items-center justify-center text-gray-400 text-sm animate-pulse bg-white">
      Memuat editor…
    </div>
  ),
});

const PdfViewer = dynamic(() => import("@/components/PdfViewer"), {
  ssr: false,
  loading: () => (
    <div className="bg-gray-600 rounded-xl p-4 text-white text-center py-10 animate-pulse text-sm">
      Memuat PDF viewer…
    </div>
  ),
});

// ── Tab definitions ──────────────────────────────────────────────────────────
type TabKind = "text" | "pdf";

interface TabDef {
  id: string;
  roman: string;
  label: string;
  kind: TabKind;
}

const TAB_DEFS: TabDef[] = [
  { id: "t1", roman: "I",   label: "Halaman 1",      kind: "text" },
  { id: "t2", roman: "II",  label: "Halaman 2",      kind: "text" },
  { id: "t3", roman: "III", label: "Lampiran PDF 1", kind: "pdf"  },
  { id: "t4", roman: "IV",  label: "Lampiran PDF 2", kind: "pdf"  },
];

// ── Component ────────────────────────────────────────────────────────────────
export default function PdfCompilerPage() {
  const [activeTab, setActiveTab] = useState(0);

  // Text tab contents (HTML from TipTap)
  const [textContents, setTextContents] = useState<Record<string, string>>({
    t1: "",
    t2: "",
  });

  // PDF tab files
  const [pdfFiles, setPdfFiles] = useState<Record<string, File | null>>({
    t3: null,
    t4: null,
  });
  const [pdfErrors, setPdfErrors] = useState<Record<string, string>>({
    t3: "",
    t4: "",
  });
  // Page counts from PdfViewer callbacks (for file info strip)
  const [pdfPageCounts, setPdfPageCounts] = useState<Record<string, number>>({
    t3: 0,
    t4: 0,
  });

  // Compile state
  const [compiling, setCompiling]   = useState(false);
  const [compileError, setCompileError] = useState("");
  const [compileDone, setCompileDone]  = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handlePdfFile(tabId: string, file: File) {
    const v = validatePdfFile(file);
    setPdfErrors((prev) => ({ ...prev, [tabId]: v.valid ? "" : v.error! }));
    setPdfFiles((prev) => ({ ...prev, [tabId]: v.valid ? file : null }));
    // Reset page count when a new file is loaded
    setPdfPageCounts((prev) => ({ ...prev, [tabId]: 0 }));
  }

  function removePdfFile(tabId: string) {
    setPdfFiles((prev) => ({ ...prev, [tabId]: null }));
    setPdfErrors((prev) => ({ ...prev, [tabId]: "" }));
    setPdfPageCounts((prev) => ({ ...prev, [tabId]: 0 }));
  }

  function buildParts(): CompilePart[] {
    return TAB_DEFS.map((tab): CompilePart => {
      if (tab.kind === "text") {
        return { type: "html", label: tab.label, html: textContents[tab.id] ?? "" };
      }
      return { type: "pdf", label: tab.label, file: pdfFiles[tab.id] ?? null };
    });
  }

  function countReadyParts(parts: CompilePart[]): number {
    return parts.filter((p) => {
      if (p.type === "html") return p.html.replace(/<[^>]*>/g, "").trim().length > 0;
      return p.file !== null;
    }).length;
  }

  async function handleCompile() {
    setCompileError("");
    setCompileDone(false);
    setCompiling(true);
    try {
      const { compilePdfs, downloadCompiledPdf } = await import(
        "@/lib/compiler/pdf-compiler"
      );
      const bytes = await compilePdfs(buildParts());
      downloadCompiledPdf(bytes, "dokumen-kompilasi.pdf");
      setCompileDone(true);
      setTimeout(() => setCompileDone(false), 4000);
    } catch (err) {
      setCompileError(
        err instanceof Error ? err.message : "Terjadi kesalahan saat kompilasi."
      );
    } finally {
      setCompiling(false);
    }
  }

  // ── Derived helpers ────────────────────────────────────────────────────────

  function tabStatus(tab: TabDef): "empty" | "ready" {
    if (tab.kind === "text") {
      return (textContents[tab.id] ?? "").replace(/<[^>]*>/g, "").trim().length > 0
        ? "ready"
        : "empty";
    }
    return pdfFiles[tab.id] ? "ready" : "empty";
  }

  const parts      = buildParts();
  const readyCount = countReadyParts(parts);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className="max-w-6xl mx-auto px-5 py-8 pb-20">
      {/* Hero */}
      <section className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">PDF Compiler</h1>
        <p className="text-gray-500">
          Isi konten pada masing-masing tab, lalu kompilasi menjadi satu file PDF secara berurutan.
        </p>
      </section>

      {/* ── Tab panel ── */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

        {/* Tab header */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {TAB_DEFS.map((tab, i) => {
            const status   = tabStatus(tab);
            const isActive = activeTab === i;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(i)}
                className={[
                  "flex-none flex items-center gap-2 px-5 py-3.5 text-sm font-medium",
                  "border-b-2 transition-colors whitespace-nowrap",
                  isActive
                    ? "border-blue-600 text-blue-700 bg-blue-50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50",
                ].join(" ")}
              >
                <span
                  className={[
                    "inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold",
                    isActive ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600",
                  ].join(" ")}
                >
                  {tab.roman}
                </span>
                {tab.label}
                <span
                  className={[
                    "inline-block w-2 h-2 rounded-full ml-1",
                    status === "ready" ? "bg-green-500" : "bg-gray-300",
                  ].join(" ")}
                  title={status === "ready" ? "Ada konten" : "Kosong"}
                />
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="p-5">
          {TAB_DEFS.map((tab, i) => (
            <div key={tab.id} className={activeTab === i ? "block" : "hidden"}>

              {/* ── Text editor tab (I, II) ── */}
              {tab.kind === "text" && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-gray-500">
                      Tab teks — konten akan dikonversi ke PDF saat dikompilasi.
                    </p>
                    {tabStatus(tab) === "ready" && (
                      <span className="text-xs text-green-600 font-semibold bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5">
                        ✓ Ada konten
                      </span>
                    )}
                  </div>
                  <RichTextEditor
                    content={textContents[tab.id] ?? ""}
                    onChange={(html) =>
                      setTextContents((prev) => ({ ...prev, [tab.id]: html }))
                    }
                    placeholder={`Ketik konten untuk ${tab.label} di sini…`}
                  />
                </div>
              )}

              {/* ── PDF upload tab (III, IV) ── */}
              {tab.kind === "pdf" && (
                <div>
                  {/* Upload area */}
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-gray-500">
                      Tab PDF — unggah file PDF yang akan disertakan dalam kompilasi.
                    </p>
                    {pdfFiles[tab.id] && (
                      <span className="text-xs text-green-600 font-semibold bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5">
                        ✓ File siap
                      </span>
                    )}
                  </div>

                  <FileDropzone
                    accept=".pdf,application/pdf"
                    label={`Upload PDF untuk ${tab.label}`}
                    hint="Pilih file PDF (maks. 20 MB) — preview tampil otomatis"
                    onFile={(f) => handlePdfFile(tab.id, f)}
                  />

                  {/* Validation error */}
                  {pdfErrors[tab.id] && (
                    <div className="mt-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                      ❌ {pdfErrors[tab.id]}
                    </div>
                  )}

                  {/* ── PDF preview area (shown after upload) ── */}
                  {pdfFiles[tab.id] && (
                    <div className="mt-4">
                      {/* File info strip with remove button */}
                      <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4">
                        <div className="text-2xl">📄</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">
                            {pdfFiles[tab.id]!.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {formatFileSize(pdfFiles[tab.id]!.size)}
                            {pdfPageCounts[tab.id] > 0 && (
                              <> · <strong>{pdfPageCounts[tab.id]}</strong> halaman</>
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() => removePdfFile(tab.id)}
                          className="flex-none flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                        >
                          🗑 Hapus
                        </button>
                      </div>

                      {/* Inline PDF viewer */}
                      <PdfViewer
                        file={pdfFiles[tab.id]!}
                        onLoadSuccess={(n) =>
                          setPdfPageCounts((prev) => ({ ...prev, [tab.id]: n }))
                        }
                      />
                    </div>
                  )}
                </div>
              )}

            </div>
          ))}
        </div>
      </div>

      {/* ── Compile panel ── */}
      <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">

          {/* Status summary */}
          <div>
            <h2 className="font-bold text-gray-900 mb-2">Ringkasan Kompilasi</h2>
            <div className="flex gap-2 flex-wrap">
              {TAB_DEFS.map((tab) => {
                const ready = tabStatus(tab) === "ready";
                return (
                  <div
                    key={tab.id}
                    className={[
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm",
                      ready
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-gray-50 border-gray-200 text-gray-400",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "w-5 h-5 rounded text-xs font-bold flex items-center justify-center",
                        ready ? "bg-green-600 text-white" : "bg-gray-300 text-gray-500",
                      ].join(" ")}
                    >
                      {tab.roman}
                    </span>
                    {tab.label}
                    {ready ? " ✓" : " —"}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Compile button */}
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={handleCompile}
              disabled={compiling || readyCount === 0}
              className={[
                "flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                compiling
                  ? "bg-blue-400 text-white cursor-wait"
                  : compileDone
                  ? "bg-green-600 text-white"
                  : "bg-blue-600 text-white hover:bg-blue-700",
              ].join(" ")}
            >
              {compiling ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                  </svg>
                  Mengompilasi…
                </>
              ) : compileDone ? (
                "✓ Berhasil Diunduh!"
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                  </svg>
                  Kompilasi &amp; Unduh PDF
                </>
              )}
            </button>
            {readyCount > 0 && (
              <p className="text-xs text-gray-500">
                {readyCount} dari {TAB_DEFS.length} tab akan dikompilasi
              </p>
            )}
            {readyCount === 0 && (
              <p className="text-xs text-amber-600">Isi minimal satu tab terlebih dahulu</p>
            )}
          </div>
        </div>

        {/* Error */}
        {compileError && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            ❌ {compileError}
          </div>
        )}

        {/* Info */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 leading-relaxed">
            Urutan PDF mengikuti urutan tab: <strong>I → II → III → IV</strong>.
            Tab yang kosong akan dilewati. Proses konversi teks ke PDF dilakukan di browser — file tidak dikirim ke server.
          </p>
        </div>
      </div>
    </main>
  );
}
