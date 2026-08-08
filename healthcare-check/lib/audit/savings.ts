import type { ExtractedItemRow, ReferenceItemRow, Finding } from "./types";

const OVERAGE_THRESHOLD = 1.2;

/**
 * Flags medicines billed above the reference price as a potential-savings
 * finding rather than a generic price check — this is the one finding type
 * that implies a substitution, so it always carries the "confirm with your
 * doctor/pharmacist" disclaimer the product brief requires.
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
    if (item.unit_price <= reference.reference_price * OVERAGE_THRESHOLD) continue;

    const quantity = item.quantity ?? 1;
    const potentialSavings = (item.unit_price - reference.reference_price) * quantity;

    findings.push({
      document_id: item.document_id,
      finding_type: "medicine_savings",
      title: `Potential savings: ${item.name}`,
      description:
        `Billed at ${item.unit_price} per unit vs a reference price of ${reference.reference_price} ` +
        `(${reference.source_name}), for a potential savings of about ${potentialSavings.toFixed(2)} ` +
        `on this line. Not a guaranteed saving — confirm any substitution with your doctor/pharmacist.`,
      evidence: {
        item: item.name,
        hospital_price: item.unit_price,
        reference_price: reference.reference_price,
        quantity,
        potential_savings: Number(potentialSavings.toFixed(2)),
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
