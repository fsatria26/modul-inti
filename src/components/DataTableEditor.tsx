"use client";

import type { DataRow, ValidationError } from "@/types/data";

type Props = {
  columns: string[];
  rows: DataRow[];
  onChange: (rows: DataRow[]) => void;
  /** Optional: set of 0-based row indices that have validation errors */
  errorRows?: Set<number>;
  validationErrors?: ValidationError[];
};

export default function DataTableEditor({ columns, rows, onChange, errorRows, validationErrors }: Props) {
  function update(rowIndex: number, column: string, value: string) {
    const next = rows.map((row, i) =>
      i === rowIndex ? { ...row, [column]: value } : row
    );
    onChange(next);
  }

  function remove(rowIndex: number) {
    onChange(rows.filter((_, i) => i !== rowIndex));
  }

  function add() {
    const row: DataRow = {};
    columns.forEach((c) => { row[c] = ""; });
    onChange([...rows, row]);
  }

  return (
    <div>
      {/* Validation errors summary */}
      {validationErrors && validationErrors.length > 0 && (
        <div className="mb-3 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 font-semibold text-sm mb-1">⚠ Peringatan validasi kolom:</p>
          <ul className="text-red-600 text-sm list-disc pl-4 space-y-0.5">
            {validationErrors.slice(0, 20).map((e, i) => (
              <li key={i}>{e.message}</li>
            ))}
            {validationErrors.length > 20 && (
              <li>...dan {validationErrors.length - 20} error lainnya.</li>
            )}
          </ul>
        </div>
      )}

      <div className="mb-3">
        <button
          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 font-semibold text-sm hover:bg-blue-100 transition-colors"
          onClick={add}
        >
          + Tambah Baris
        </button>
      </div>

      <div className="overflow-auto rounded-xl border border-gray-200">
        <table className="border-collapse w-full min-w-[600px] bg-white text-sm">
          <thead>
            <tr>
              <th className="bg-gray-50 border-b border-gray-200 px-3 py-2 text-left text-xs font-bold text-gray-500 w-12">#</th>
              {columns.map((c) => (
                <th key={c} className="bg-gray-50 border-b border-gray-200 px-3 py-2 text-left text-xs font-bold text-gray-700 sticky top-0">
                  {c}
                </th>
              ))}
              <th className="bg-gray-50 border-b border-gray-200 px-3 py-2 text-left text-xs font-bold text-gray-500 w-20">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => {
              const hasError = errorRows?.has(ri);
              return (
                <tr key={ri} className={hasError ? "bg-red-50" : "hover:bg-gray-50"}>
                  <td className="border-b border-gray-100 px-3 py-1 text-gray-400 text-xs">{ri + 1}</td>
                  {columns.map((c) => (
                    <td key={c} className="border-b border-gray-100 px-2 py-1">
                      <input
                        value={row[c] ?? ""}
                        onChange={(e) => update(ri, c, e.target.value)}
                        className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                      />
                    </td>
                  ))}
                  <td className="border-b border-gray-100 px-2 py-1">
                    <button
                      className="px-2 py-1 text-xs rounded bg-red-50 text-red-700 hover:bg-red-100 font-semibold transition-colors"
                      onClick={() => remove(ri)}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}