/** A text (HTML) part from a rich-text editor tab */
export type TextPart = {
  type: "html";
  label: string;
  html: string;
};

/** A PDF part from an upload tab */
export type PdfPart = {
  type: "pdf";
  label: string;
  file: File | null;
};

export type CompilePart = TextPart | PdfPart;
