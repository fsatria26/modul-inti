"use client";

import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export default function PdfViewer({ file, onLoadSuccess }: { file: File; onLoadSuccess?: (numPages: number) => void }) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    setPageNumber(1);
    setNumPages(0);
    setLoading(true);
    setLoadError(false);
  }, [file]);

  return (
    <div>
      {/* Page & zoom controls */}
      <div className="flex items-center justify-center gap-3 flex-wrap mb-4">
        <button
          className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 disabled:opacity-40 transition-colors"
          disabled={pageNumber <= 1}
          onClick={() => setPageNumber((p) => p - 1)}
        >
          ←
        </button>
        <span className="text-sm font-semibold text-gray-700 min-w-[90px] text-center">
          {numPages ? `${pageNumber} / ${numPages}` : "Memuat…"}
        </span>
        <button
          className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 disabled:opacity-40 transition-colors"
          disabled={pageNumber >= numPages}
          onClick={() => setPageNumber((p) => p + 1)}
        >
          →
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <button
          className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 disabled:opacity-40 transition-colors"
          disabled={scale <= 0.5}
          onClick={() => setScale((s) => Math.max(0.5, +(s - 0.1).toFixed(1)))}
        >
          Zoom −
        </button>
        <span className="text-sm font-semibold text-gray-700 w-14 text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 disabled:opacity-40 transition-colors"
          disabled={scale >= 2.5}
          onClick={() => setScale((s) => Math.min(2.5, +(s + 0.1).toFixed(1)))}
        >
          Zoom +
        </button>
      </div>

      {/* PDF canvas */}
      <div className="bg-gray-600 rounded-xl p-4 overflow-auto">
        {loadError ? (
          <div className="text-white text-center py-8">
            ❌ File PDF tidak dapat dibaca. Silakan periksa kembali file.
          </div>
        ) : (
          <Document
            file={file}
            onLoadSuccess={({ numPages: n }) => {
              setNumPages(n);
              setLoading(false);
              onLoadSuccess?.(n);
            }}
            onLoadError={() => {
              setLoading(false);
              setLoadError(true);
            }}
            loading={
              <div className="text-white text-center py-8 animate-pulse">Memuat PDF…</div>
            }
          >
            {loading && (
              <div className="text-white text-center py-8 animate-pulse">Memuat PDF…</div>
            )}
            <div className="mx-auto w-max bg-white shadow-2xl rounded">
              <Page pageNumber={pageNumber} scale={scale} />
            </div>
          </Document>
        )}
      </div>
    </div>
  );
}