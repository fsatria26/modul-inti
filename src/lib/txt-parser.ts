/**
 * Re-export shim — keeps any future code importing from "@/lib/txt-parser" working.
 * New code should import from "@/lib/parser/txt-parser" or "@/lib/exporter/txt-exporter".
 */
export { parseTxt, countLines, type DataRow } from "@/lib/parser/txt-parser";
export { dataToTxt, downloadText } from "@/lib/exporter/txt-exporter";