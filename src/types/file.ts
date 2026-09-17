/** Supported module file types */
export type SupportedFileType = "txt" | "json" | "pdf";

/** Result of file validation */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/** Config for TXT export */
export interface TxtExportConfig {
  separator: string;
  includeHeader: boolean;
  /** "\r\n" | "\n" */
  lineEnding: "\r\n" | "\n";
}
