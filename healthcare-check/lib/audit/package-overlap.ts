import type { ExtractedItemRow, Finding } from "./types";
import { itemsLineage, withLineage } from "./lineage.ts";

// Small, demo-curated map of package -> component keywords typically
// bundled into that package. Not sourced from any hospital's actual
// tariff schedule — a real version of this needs hospital package
// documents, which are explicitly out of scope for the MVP.
const PACKAGE_OVERLAP_KEYWORDS: Record<string, string[]> = {
  "appendectomy laparoscopic": [
    "anesthesia",
    "anaesthesia",
    "ot charge",
    "operation theatre",
    "surgical gloves",
    "iv cannula",
    "nursing",
  ],
  "normal delivery": [
    "room rent",
    "nursing",
    "iv cannula",
    "surgical gloves",
    "normal saline",
    "ringer lactate",
  ],
};

/**
 * When a document bills a known package alongside a component commonly
 * included in that package, flags it as worth checking for overlap —
 * deliberately not called a duplicate, since packages legitimately vary
 * in what they include.
 */
export function checkPackageOverlap(items: ExtractedItemRow[]): Finding[] {
  const findings: Finding[] = [];

  const packageItems = items.filter(
    (i) => i.item_type === "procedure" && i.normalized_name && i.normalized_name in PACKAGE_OVERLAP_KEYWORDS,
  );

  for (const pkg of packageItems) {
    const keywords = PACKAGE_OVERLAP_KEYWORDS[pkg.normalized_name!];

    for (const item of items) {
      if (item.id === pkg.id || item.document_id !== pkg.document_id) continue;
      const name = item.normalized_name ?? item.name.toLowerCase();
      const overlapsKeyword = keywords.find((kw) => name.includes(kw));
      if (!overlapsKeyword) continue;

      findings.push({
        document_id: pkg.document_id,
        finding_type: "package_overlap",
        title: `Potential package overlap: ${item.name}`,
        description:
          `"${pkg.name}" is billed as a package, and "${item.name}" is separately billed on the ` +
          `same document. Packages like this commonly include this component — worth checking ` +
          `whether it's already covered rather than an extra charge. Not automatically a duplicate.`,
        evidence: withLineage({
          package_item: pkg.name,
          component_item: item.name,
          component_total_price: item.total_price,
          page: item.source_page,
          original_text: item.raw_text,
        }, itemsLineage([pkg, item], "audit.package-overlap.keyword", {
          field: "normalized_name",
        })),
        confidence: "low",
        related_item_id: item.id,
      });
    }
  }

  return findings;
}
