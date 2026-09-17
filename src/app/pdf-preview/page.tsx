"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import FileDropzone from "@/components/FileDropzone";
import { validatePdfFile, formatFileSize } from "@/lib/validation/file-validation";

// Load PdfViewer only on client to prevent PDF.js DOM errors during SSR/prerender
const PdfViewer = dynamic(() => import("@/components/PdfViewer"), {
  ssr: false,
  loading: () => (
    <div className="bg-gray-600 rounded-xl p-4 text-white text-center py-12 animate-pulse">
      Memuat PDF viewer…
    </div>
  ),
});

export default function PdfPreviewPage() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState<number | null>(null);

  function handleFile(next: File) {
    setError("");
    setFile(null);
    setTotalPages(null);

    const validation = validatePdfFile(next);
    if (!validation.valid) {
      setError(validation.error!);
      return;
    }
    setFile(next);
  }

  return (
    <main className="max-w-6xl mx-auto px-5 py-8 pb-20">
      {/* Hero */}
      <section className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">PDF Preview</h1>
        <p className="text-gray-500">Upload file PDF untuk melihat halaman langsung di browser, lengkap dengan navigasi dan zoom.</p>
      </section>

      {/* Upload */}
      <section className="bg-white border border-gray-200 rounded-2xl p-5 mb-4 shadow-sm">
        <FileDropzone
          accept=".pdf,application/pdf"
          label="Upload File PDF"
          hint="Pilih file PDF dari komputer (maks. 20 MB)"
          onFile={handleFile}
        />
      </section>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">
          ❌ {error}
        </div>
      )}

      {/* File info & viewer */}
      {file && (
        <>
          {/* File info strip */}
          <div className="flex gap-3 flex-wrap mb-4">
            {[
              { label: "File", value: file.name },
              { label: "Ukuran", value: formatFileSize(file.size) },
              { label: "Halaman", value: totalPages != null ? totalPages.toString() : "—" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
                <span className="text-xs text-gray-500 block">{stat.label}</span>
                <strong className="text-sm text-gray-900">{stat.value}</strong>
              </div>
            ))}
          </div>

          <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <PdfViewer file={file} onLoadSuccess={setTotalPages} />
          </section>
        </>
      )}
    </main>
  );
}