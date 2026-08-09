import { readFile } from "node:fs/promises";
import type { PmbiSourceRow, SourceMetadata } from "../../lib/reference/ingestion.ts";

export const pmbiMetadata: SourceMetadata = {
  sourceKind: "pmbi",
  sourceName: "PMBJP Product List (official PMBI PDF)",
  sourceUrl: "https://janaushadhi.gov.in/Data/PMBJP%20Product.pdf",
  retrievedAt: "2026-08-10T00:00:00.000Z",
  effectiveDate: null,
};

const payload = JSON.parse(
  await readFile(new URL("./pmbi-slice.json", import.meta.url), "utf8"),
) as { rows: PmbiSourceRow[] };

export const pmbiSlice = payload.rows;
