import path from "path";
import { pathToFileURL } from "url";

export type ExtractedPage = {
  pageNumber: number;
  content: string;
};

/**
 * Extracts the embedded text layer per page from a digital-native PDF.
 * Scanned pages with no text layer come back with an empty string —
 * callers should flag those as low confidence rather than guessing.
 */
export async function extractPdfPages(buffer: Buffer): Promise<ExtractedPage[]> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  // pdf.js needs a real worker script path even when running "workerless"
  // in Node. Built as a plain path string (not require.resolve) so webpack
  // never tries to statically analyze a require() of an ESM file — pdf.js
  // dynamically imports this path itself at actual runtime.
  pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(
    path.join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"),
  ).href;

  const doc = await pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    useSystemFonts: true,
  }).promise;

  const pages: ExtractedPage[] = [];

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
    const page = await doc.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const content = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    pages.push({ pageNumber, content });
  }

  return pages;
}
