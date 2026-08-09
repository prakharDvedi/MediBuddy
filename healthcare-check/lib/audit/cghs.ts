import type { CghsReferenceRecordRow, ExtractedItemRow, Finding } from "./types";
import { itemLineage, withLineage } from "./lineage.ts";
import { normalizeText } from "../medicines/normalize.ts";

const OVERAGE_THRESHOLD = 1.2;

function isContextFreeRate(record: CghsReferenceRecordRow): boolean {
  return normalizeText(record.rate_context) === "uniform";
}

/**
 * Compares clearly identified procedure/service line items against CGHS records only
 * when one current, context-free rate exists for the normalized description.
 * Context-specific rates are retained for provenance but deliberately skipped.
 */
export function checkCghsPrices(
  items: ExtractedItemRow[],
  records: CghsReferenceRecordRow[],
): Finding[] {
  const recordsByName = new Map<string, CghsReferenceRecordRow[]>();
  for (const record of records) {
    const group = recordsByName.get(record.normalized_name) ?? [];
    group.push(record);
    recordsByName.set(record.normalized_name, group);
  }

  const findings: Finding[] = [];
  for (const item of items) {
    if (item.item_type !== "procedure" && item.item_type !== "service") continue;
    if (!item.normalized_name || item.unit_price == null) continue;
    const candidates = recordsByName.get(normalizeText(item.normalized_name)) ?? [];
    if (candidates.length !== 1) continue;
    const reference = candidates[0];
    if (!isContextFreeRate(reference) || item.unit_price <= reference.rate * OVERAGE_THRESHOLD) continue;

    findings.push({
      document_id: item.document_id,
      finding_type: "price",
      title: `CGHS reference worth checking: ${item.name}`,
      description:
        `Billed at ₹${item.unit_price} per ${reference.rate_unit}; the current CGHS reference is ` +
        `₹${reference.rate} (${reference.code}, ${reference.category}). ` +
        `This is a reference worth checking with the hospital, not by itself proof of an overcharge.`,
      evidence: withLineage({
        item: item.name,
        hospital_price: item.unit_price,
        cghs_rate: reference.rate,
        rate_unit: reference.rate_unit,
        rate_context: reference.rate_context,
        cghs_code: reference.code,
        record_kind: reference.record_kind,
        category: reference.category,
        description: reference.description,
        inclusion_notes: reference.inclusion_notes,
        exclusion_notes: reference.exclusion_notes,
        applicability_conditions: reference.applicability_conditions,
        source: reference.source_name,
        source_url: reference.source_url,
        source_page: reference.source_page,
        effective_date: reference.effective_date,
        retrieved_at: reference.retrieved_at,
        page: item.source_page,
        original_text: item.raw_text,
      }, itemLineage(item, "audit.cghs.overage", {
        field: "unit_price",
        canonicalEntityId: reference.code,
        canonicalEntityType: `cghs_${reference.record_kind}`,
        referenceRecordId: reference.id,
        sourceKind: "cghs",
        calculation: {
          formula: "hospital_price > cghs_rate * threshold",
          inputs: {
            hospital_price: item.unit_price,
            cghs_rate: reference.rate,
            threshold: OVERAGE_THRESHOLD,
          },
          output: Number((item.unit_price - reference.rate).toFixed(2)),
        },
      })),
      confidence: item.confidence === "low" ? "low" : "medium",
      related_item_id: item.id,
    });
  }

  return findings;
}
