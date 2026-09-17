/** A single record: field name → string value */
export type DataRow = Record<string, string>;

/** Result of parsing a TXT file */
export interface ParseResult {
  columns: string[];
  rows: DataRow[];
  errors: ValidationError[];
}

/** A per-row column count mismatch error */
export interface ValidationError {
  /** 1-based data line number (after header) */
  line: number;
  expected: number;
  actual: number;
  message: string;
}

/** Metadata about the uploaded file */
export interface FileInfo {
  name: string;
  /** Size in bytes */
  size: number;
  /** Detected line count (TXT/JSON only) */
  lineCount?: number;
  encoding?: string;
}
