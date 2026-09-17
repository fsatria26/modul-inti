import type { FileValidationResult } from "@/types/file";

const MAX_TXT_SIZE = 10 * 1024 * 1024;   // 10 MB
const MAX_JSON_SIZE = 10 * 1024 * 1024;  // 10 MB
const MAX_PDF_SIZE = 20 * 1024 * 1024;   // 20 MB

export function validateTxtFile(file: File): FileValidationResult {
  const name = file.name.toLowerCase();
  if (!name.endsWith(".txt")) {
    return { valid: false, error: "File tidak didukung. Silakan upload file TXT." };
  }
  if (file.size === 0) {
    return { valid: false, error: "File kosong dan tidak dapat diproses." };
  }
  if (file.size > MAX_TXT_SIZE) {
    return { valid: false, error: `Ukuran file melebihi batas maksimal 10 MB (${(file.size / 1024 / 1024).toFixed(1)} MB).` };
  }
  return { valid: true };
}

export function validateJsonFile(file: File): FileValidationResult {
  const name = file.name.toLowerCase();
  if (!name.endsWith(".json")) {
    return { valid: false, error: "File tidak didukung. Silakan upload file JSON." };
  }
  if (file.size === 0) {
    return { valid: false, error: "File kosong dan tidak dapat diproses." };
  }
  if (file.size > MAX_JSON_SIZE) {
    return { valid: false, error: `Ukuran file melebihi batas maksimal 10 MB (${(file.size / 1024 / 1024).toFixed(1)} MB).` };
  }
  return { valid: true };
}

export function validatePdfFile(file: File): FileValidationResult {
  const name = file.name.toLowerCase();
  const mimeOk = file.type === "application/pdf";
  if (!name.endsWith(".pdf") || !mimeOk) {
    return { valid: false, error: "File tidak didukung. Silakan upload file PDF." };
  }
  if (file.size === 0) {
    return { valid: false, error: "File kosong dan tidak dapat diproses." };
  }
  if (file.size > MAX_PDF_SIZE) {
    return { valid: false, error: `Ukuran file melebihi batas maksimal 20 MB (${(file.size / 1024 / 1024).toFixed(1)} MB).` };
  }
  return { valid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
