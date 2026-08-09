import type { ExtractedItemRow, Finding } from "./types";
import { itemLineage, withLineage } from "./lineage.ts";

const UNEXPLAINED_KEYWORDS = [
  "miscellaneous",
  "misc",
  "other charge",
  "other charges",
  "administrative",
  "additional expense",
  "additional expenses",
  "sundry",
];

/**
 * Flags vaguely-named, poorly itemized charges — the "miscellaneous /
 * administrative / other charges" pattern the product brief calls out
 * explicitly, plus generic unnamed consumable line items.
 */
export function checkUnexplained(items: ExtractedItemRow[]): Finding[] {
  const findings: Finding[] = [];

  for (const item of items) {
    const name = item.normalized_name ?? item.name.toLowerCase();
    const matchesKeyword = UNEXPLAINED_KEYWORDS.some((kw) => name.includes(kw));
    const isVagueConsumable = item.item_type === "consumable" && name.trim() === "consumables";

    if (!matchesKeyword && !isVagueConsumable) continue;

    findings.push({
      document_id: item.document_id,
      finding_type: "unexplained",
      title: `Unexplained charge: ${item.name}`,
      description:
        `This charge isn't itemized in a way that says what it actually covers. ` +
        `Worth asking the hospital for a breakdown.`,
      evidence: withLineage({
        item: item.name,
        total_price: item.total_price,
        page: item.source_page,
        original_text: item.raw_text,
      }, itemLineage(item, "audit.unexplained-charge.keyword", {
        field: "name",
      })),
      confidence: "medium",
      related_item_id: item.id,
    });
  }

  return findings;
}
