import type { ExtractedItemRow, ReferenceItemRow, Finding } from "./types";
import { unitUnverifiedFinding, verifyReferenceUnit } from "./unit";

const OVERAGE_THRESHOLD = 1.2;

/**
 * Flags a medicine line for a careful NPPA reference comparison and reports
 * a potential price difference only after the sale unit has been verified.
 */
export function checkMedicineSavings(
  items: ExtractedItemRow[],
  referenceItems: ReferenceItemRow[],
): Finding[] {
  const referenceByName = new Map(referenceItems.map((r) => [r.normalized_name, r]));
  const findings: Finding[] = [];

  for (const item of items) {
    if (item.item_type !== "medicine") continue;
    if (!item.normalized_name || item.unit_price == null) continue;

    const reference = referenceByName.get(item.normalized_name);
    if (!reference) continue;

    if (!verifyReferenceUnit(item, reference).compatible) {
      findings.push(unitUnverifiedFinding(item, reference));
      continue;
    }

    if (item.unit_price <= reference.reference_price * OVERAGE_THRESHOLD) continue;

    const quantity = item.quantity ?? 1;
    const potentialPriceDifference = Number(
      ((item.unit_price - reference.reference_price) * quantity).toFixed(2),
    );

    findings.push({
      document_id: item.document_id,
      finding_type: "medicine_savings",
      title: `Potential savings worth investigating: ${item.name}`,
      description:
        `Hospital price: ₹${item.unit_price} per verified unit. NPPA reference: ` +
        `₹${reference.reference_price} / ${reference.unit ?? "unit"} (${reference.source_name}). ` +
        `Potential price difference: ₹${potentialPriceDifference}. This is worth investigating ` +
        `with the hospital or pharmacist. Estimated from the available reference price. This does ` +
        `not guarantee that this amount is recoverable or that the hospital charge is unlawful.`,
      evidence: {
        item: item.name,
        hospital_price: item.unit_price,
        reference_price: reference.reference_price,
        reference_unit: reference.unit,
        quantity,
        potential_savings: potentialPriceDifference,
        source: reference.source_name,
        source_url: reference.source_url,
        page: item.source_page,
        original_text: item.raw_text,
      },
      confidence: item.confidence === "low" ? "low" : "medium",
      related_item_id: item.id,
    });
  }

  return findings;
}
