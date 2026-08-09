import type { ExtractedItemRow, ReferenceItemRow, Finding } from "./types";
import { unitUnverifiedFinding, verifyReferenceUnit } from "./unit";

// How far above the reference price a billed item has to be before it's
// worth surfacing — small variance is normal, this isn't meant to catch
// every rounding difference.
const OVERAGE_THRESHOLD = 1.2;

/**
 * Compares billed unit prices against the available reference dataset for
 * non-medicine items (procedures/tests/consumables/charges). Medicines are
 * handled by savings.ts instead, with NPPA-specific framing.
 */
export function checkPrices(
  items: ExtractedItemRow[],
  referenceItems: ReferenceItemRow[],
): Finding[] {
  const referenceByName = new Map(referenceItems.map((r) => [r.normalized_name, r]));
  const findings: Finding[] = [];

  for (const item of items) {
    if (item.item_type === "medicine") continue;
    if (!item.normalized_name || item.unit_price == null) continue;

    const reference = referenceByName.get(item.normalized_name);
    if (!reference) continue;

    if (!verifyReferenceUnit(item, reference).compatible) {
      findings.push(unitUnverifiedFinding(item, reference));
      continue;
    }

    if (item.unit_price > reference.reference_price * OVERAGE_THRESHOLD) {
      findings.push({
        document_id: item.document_id,
        finding_type: "price",
        title: `Price worth checking: ${item.name}`,
        description:
          `Billed at ${item.unit_price} per verified unit; the available reference price is ` +
          `${reference.reference_price} (${reference.source_name}). ` +
          `The billed amount is higher than the available reference, so this is worth checking ` +
          `with the hospital; it is not by itself proof of an overcharge.`,
        evidence: {
          item: item.name,
          hospital_price: item.unit_price,
          reference_price: reference.reference_price,
          reference_unit: reference.unit,
          source: reference.source_name,
          source_url: reference.source_url,
          page: item.source_page,
          original_text: item.raw_text,
        },
        confidence: item.confidence === "low" ? "low" : "medium",
        related_item_id: item.id,
      });
    }
  }

  return findings;
}
