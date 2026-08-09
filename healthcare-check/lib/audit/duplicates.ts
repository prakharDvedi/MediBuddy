import type { ExtractedItemRow, Finding } from "./types";
import { itemsLineage, withLineage } from "./lineage.ts";

/**
 * Groups items by normalized name across every document in the case and
 * flags any name that shows up more than once. Catches the same charge
 * billed twice on one document as easily as the same line repeated across
 * an estimate and a later bill.
 */
export function checkDuplicates(items: ExtractedItemRow[]): Finding[] {
  const groups = new Map<string, ExtractedItemRow[]>();

  for (const item of items) {
    if (!item.normalized_name) continue;
    const key = `${item.item_type ?? "misc"}:${item.normalized_name}`;
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }

  const findings: Finding[] = [];

  for (const group of groups.values()) {
    if (group.length < 2) continue;

    const pages = group.map((i) => i.source_page).filter((p): p is number => p != null);
    const documentIds = [...new Set(group.map((i) => i.document_id))];

    findings.push({
      document_id: documentIds.length === 1 ? documentIds[0] : null,
      finding_type: "duplicate",
      title: `Possible duplicate: ${group[0].name}`,
      description:
        `"${group[0].name}" appears ${group.length} times` +
        (pages.length > 0 ? ` (pages: ${pages.join(", ")})` : "") +
        `. Worth confirming this isn't billed more than once for the same charge.`,
      evidence: withLineage({
        item: group[0].name,
        occurrences: group.map((i) => ({
          document_id: i.document_id,
          page: i.source_page,
          quantity: i.quantity,
          total_price: i.total_price,
          original_text: i.raw_text,
        })),
      }, itemsLineage(group, "audit.duplicate.normalized-item", {
        field: "normalized_name",
      })),
      confidence: group.every((i) => i.confidence === "high") ? "high" : "medium",
      related_item_id: group[0].id,
    });
  }

  return findings;
}
