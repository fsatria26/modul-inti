"use client";

import { useState } from "react";

type Props = {
  json: string;
  /** Total record count (may exceed preview limit) */
  totalCount?: number;
  previewLimit?: number;
};

export default function JsonPreview({ json, totalCount, previewLimit = 100 }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-bold text-gray-800">JSON Preview</h2>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors"
        >
          {copied ? "✓ Tersalin!" : "📋 Salin JSON"}
        </button>
      </div>
      <pre className="bg-gray-900 text-green-300 p-4 rounded-xl overflow-auto max-h-96 text-xs leading-5 font-mono">
        {json}
      </pre>
      {totalCount !== undefined && totalCount > previewLimit && (
        <p className="text-xs text-gray-500 mt-2">
          Preview dibatasi {previewLimit} record. Export tetap mencakup seluruh {totalCount} record.
        </p>
      )}
    </div>
  );
}
