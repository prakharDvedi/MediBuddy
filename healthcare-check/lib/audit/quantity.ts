import type { ExtractedItemRow, Finding } from "./types";

// Rough noise filters, not clinical thresholds — we have no authoritative
// standard-quantity dataset, so this only decides what's worth asking
// about, never what the "correct" quantity should have been.
const UNIT_THRESHOLDS: Record<string, number> = {
  tablet: 30,
  capsule: 30,
  injection: 10,
  ampoule: 10,
  vial: 10,
};

function thresholdFor(item: ExtractedItemRow): number | null {
  const name = item.normalized_name ?? "";
  for (const [keyword, threshold] of Object.entries(UNIT_THRESHOLDS)) {
    if (name.includes(keyword)) return threshold;
  }
  return null;
}

/**
 * Flags unusually high quantities as worth clarifying. This is explicitly
 * not a medical judgment — we have no standard-treatment-guideline data to
 * validate against, so the finding says exactly that rather than implying
 * we know what the "right" quantity is.
 */
export function checkQuantities(items: ExtractedItemRow[]): Finding[] {
  const findings: Finding[] = [];

  for (const item of items) {
    if (item.item_type !== "medicine" || item.quantity == null) continue;

    const threshold = thresholdFor(item);
    if (threshold == null || item.quantity <= threshold) continue;

    findings.push({
      document_id: item.document_id,
      finding_type: "quantity",
      title: `Quantity requires clarification: ${item.name}`,
      description:
        `Billed quantity is ${item.quantity}, which is higher than typical for this item. ` +
        `We don't have an authoritative standard quantity to verify this against — worth asking ` +
        `the hospital why this quantity was needed.`,
      evidence: {
        item: item.name,
        quantity: item.quantity,
        page: item.source_page,
        original_text: item.raw_text,
      },
      confidence: "low",
      related_item_id: item.id,
    });
  }

  return findings;
}
