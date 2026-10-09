import type { CompilePart } from "@/types/compiler";

/** A4 dimensions */
const A4_W_PX  = 794;   // ≈ 210 mm at 96 dpi
const A4_H_MM  = 297;   // mm
const A4_W_MM  = 210;   // mm

/**
 * Typography CSS injected into the iframe document so TipTap's semantic
 * HTML tags (h1, ul, strong, etc.) render correctly for PDF capture.
 */
const EDITOR_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    width: ${A4_W_PX}px;
    min-height: 100px;
    background: #fff;
    padding: 56px 64px;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 13px;
    line-height: 1.8;
    color: #111827;
    word-break: break-word;
    overflow-wrap: break-word;
  }

  h1 { font-size: 22px; font-weight: 800; margin: 16px 0 8px;  line-height: 1.3; }
  h2 { font-size: 18px; font-weight: 700; margin: 14px 0 6px;  line-height: 1.35; }
  h3 { font-size: 15px; font-weight: 700; margin: 12px 0 4px; }
  p  { margin: 5px 0; }

  strong { font-weight: 700; }
  em     { font-style: italic; }
  u      { text-decoration: underline; }
  s      { text-decoration: line-through; }

  ul { list-style-type: disc;    padding-left: 24px; margin: 4px 0; }
  ol { list-style-type: decimal; padding-left: 24px; margin: 4px 0; }
  li { margin: 2px 0; }
  ul ul    { list-style-type: circle; }
  ul ul ul { list-style-type: square; }

  blockquote {
    border-left: 3px solid #d1d5db;
    padding-left: 14px;
    color: #6b7280;
    margin: 8px 0;
  }
`;

/**
 * Convert an HTML string (from TipTap) to A4 PDF bytes.
 *
 * Uses an off-screen <iframe> so the content is fully styled and laid out in
 * isolation. html2canvas then captures the iframe's body, which is always at
 * viewport coordinates (0, 0) — no off-screen positioning bugs.
 */
async function htmlToPdfBytes(html: string): Promise<Uint8Array> {
  const jsPDF       = (await import("jspdf")).default;
  const html2canvas  = (await import("html2canvas")).default;

  // ── 1. Create a hidden iframe ────────────────────────────────────────────
  const iframe = document.createElement("iframe");
  Object.assign(iframe.style, {
    position: "fixed",
    top:      "0",
    left:     "0",
    width:    `${A4_W_PX}px`,
    height:   "1px",          // will grow with content
    border:   "none",
    opacity:  "0",
    pointerEvents: "none",
    zIndex:   "-9999",
  });
  document.body.appendChild(iframe);

  try {
    const iDoc  = iframe.contentDocument!;
    const iWin  = iframe.contentWindow!;

    // Write full HTML document so styles cascade correctly
    iDoc.open();
    iDoc.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8">
      <style>${EDITOR_CSS}</style>
    </head><body>${html}</body></html>`);
    iDoc.close();

    // Wait for the iframe to finish rendering
    await new Promise<void>((resolve) => {
      if (iDoc.readyState === "complete") {
        resolve();
      } else {
        iWin.addEventListener("load", () => resolve(), { once: true });
      }
    });
    // Extra frame to ensure CSS layout is applied
    await new Promise<void>((r) => iWin.requestAnimationFrame(() => iWin.requestAnimationFrame(() => r())));
    await new Promise<void>((r) => setTimeout(r, 80));

    const body       = iDoc.body;
    const bodyHeight = body.scrollHeight;

    // Resize iframe to full content height so html2canvas captures everything
    iframe.style.height = `${bodyHeight}px`;

    // Extra settle time after resize
    await new Promise<void>((r) => setTimeout(r, 80));

    // ── 2. Capture with html2canvas ─────────────────────────────────────────
    const canvas = await html2canvas(body, {
      useCORS:         true,
      allowTaint:      true,
      logging:         false,
      scale:           2,           // 2× for crisp text
      backgroundColor: "#ffffff",
      width:           A4_W_PX,
      height:          bodyHeight,
      scrollX:         0,
      scrollY:         0,
      windowWidth:     A4_W_PX,
      windowHeight:    bodyHeight,
    });

    // ── 3. Slice canvas into A4 pages ────────────────────────────────────────
    const doc      = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const imgData  = canvas.toDataURL("image/jpeg", 0.92);
    // Total image height in mm (preserving the width:height ratio of the canvas)
    const imgH_mm  = (canvas.height / canvas.width) * A4_W_MM;

    let yMm   = 0;
    let first = true;

    while (yMm < imgH_mm) {
      if (!first) doc.addPage();
      // Place full image offset upward so only the current page's slice is visible
      doc.addImage(imgData, "JPEG", 0, -yMm, A4_W_MM, imgH_mm);
      yMm  += A4_H_MM;
      first = false;
    }

    return new Uint8Array(doc.output("arraybuffer") as ArrayBuffer);

  } finally {
    if (iframe.parentNode) document.body.removeChild(iframe);
  }
}

/**
 * Compile an ordered list of HTML content + uploaded PDF files into one PDF.
 * Skips empty text tabs and missing PDF files silently.
 */
export async function compilePdfs(parts: CompilePart[]): Promise<Uint8Array> {
  const { PDFDocument } = await import("pdf-lib");
  const merged = await PDFDocument.create();

  for (const part of parts) {
    try {
      if (part.type === "html") {
        // Skip genuinely empty editor tabs (only whitespace / empty tags)
        const text = part.html.replace(/<[^>]*>/g, "").trim();
        if (!text) continue;

        const bytes = await htmlToPdfBytes(part.html);
        const doc   = await PDFDocument.load(bytes);
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => merged.addPage(p));

      } else {
        if (!part.file) continue;

        const bytes = await part.file.arrayBuffer();
        const doc   = await PDFDocument.load(new Uint8Array(bytes));
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      }
    } catch (err) {
      console.error(`[pdf-compiler] Error processing "${part.label}":`, err);
      // Continue with remaining parts rather than aborting the whole compilation
    }
  }

  return merged.save();
}

/** Trigger a browser download of the compiled PDF. */
export function downloadCompiledPdf(bytes: Uint8Array, filename = "compiled.pdf"): void {
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
