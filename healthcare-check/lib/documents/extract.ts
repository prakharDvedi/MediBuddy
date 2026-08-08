import { extractPdfPages } from "./pdf";
import { extractTextFromImage } from "./groq";

export type ExtractedPage = {
  pageNumber: number;
  content: string;
};

/**
 * Extracts per-page text for a supported document. PDFs use their
 * embedded text layer (fast, exact, free); images go through Groq's
 * vision model as a single page. Scanned PDFs with no text layer come
 * back with empty content per page rather than being silently dropped —
 * callers/UI should surface that honestly instead of guessing.
 */
export async function extractDocumentPages(
  buffer: Buffer,
  mimeType: string,
): Promise<ExtractedPage[]> {
  if (mimeType === "application/pdf") {
    return extractPdfPages(buffer);
  }

  if (mimeType === "image/jpeg" || mimeType === "image/png") {
    const raw = await extractTextFromImage(buffer, mimeType);
    const content = raw.trim() === "NO_TEXT_FOUND" ? "" : raw;
    return [{ pageNumber: 1, content }];
  }

  throw new Error(`Unsupported mime type: ${mimeType}`);
}
