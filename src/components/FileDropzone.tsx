"use client";

import { useRef, useState } from "react";

type Props = {
  accept: string;
  label: string;
  hint?: string;
  onFile: (file: File) => void;
};

export default function FileDropzone({ accept, label, hint, onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);

  function handleFile(file: File) {
    setPicked(file.name);
    onFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={[
        "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors select-none",
        dragging
          ? "border-blue-500 bg-blue-50"
          : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50",
      ].join(" ")}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.currentTarget.value = "";
        }}
      />
      <div className="text-3xl mb-2">📂</div>
      <strong className="block text-gray-800">{label}</strong>
      <div className="text-sm text-gray-500 mt-1">
        {picked ? (
          <span className="text-blue-600 font-medium">✓ {picked}</span>
        ) : (
          hint ?? "Klik atau drag & drop file ke sini"
        )}
      </div>
    </div>
  );
}