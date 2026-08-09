import type { ExtractedItemRow, ReferenceItemRow } from "./types";
import { itemLineage, withLineage } from "./lineage.ts";

export type UnitVerification = {
  compatible: boolean;
  reason: string;
};

function itemText(item: ExtractedItemRow): string {
  // normalized_name is a matching key and may be canonicalized by the model;
  // it is not reliable evidence that the bill stated a sale unit.
  return [item.name, item.raw_text].filter(Boolean).join(" ").toLowerCase();
}

function hasPackContext(text: string): boolean {
  return /\b(pack|strip|box|bottle|sachet|tube)\b/.test(text);
}

/** Fail closed unless the extracted bill line exposes the same sale unit. */
export function verifyReferenceUnit(
  item: ExtractedItemRow,
  reference: ReferenceItemRow,
): UnitVerification {
  if (!reference.unit) return { compatible: true, reason: "Reference has no unit descriptor." };

  const text = itemText(item);
  const referenceUnit = reference.unit.toLowerCase().replace(/\s+/g, " ").trim();

  if (referenceUnit === "1 tablet") {
    return { compatible: /\btablet\b/.test(text) && !hasPackContext(text), reason: "Expected one tablet." };
  }
  if (referenceUnit === "1 capsule") {
    return { compatible: /\bcapsule\b/.test(text) && !hasPackContext(text), reason: "Expected one capsule." };
  }
  if (referenceUnit === "1 suppository") {
    return {
      compatible: /\bsuppositor(?:y|ies)\b/.test(text) && !hasPackContext(text),
      reason: "Expected one suppository.",
    };
  }
  if (referenceUnit === "each vial") {
    return { compatible: /\bvial\b/.test(text), reason: "Expected an explicitly billed vial." };
  }
  if (referenceUnit === "each pack") {
    return { compatible: /\bpack\b/.test(text), reason: "Expected an explicitly billed pack." };
  }
  if (referenceUnit === "2 ml pack") {
    return {
      compatible: /\b2\s*ml\b/.test(text) && /\bpack\b/.test(text),
      reason: "Expected an explicitly billed 2 ml pack.",
    };
  }
  if (referenceUnit === "1 ml") {
    return {
      compatible: /\b(?:\d+(?:\.\d+)?\s*)?ml\b/.test(text) && !/\b2\s*ml\b/.test(text),
      reason: "Expected an explicitly stated per-ml context.",
    };
  }

  const unitToken = referenceUnit.replace(/^1\s+/, "").split(/\s+/)[0];
  return {
    compatible: new RegExp(`\\b${unitToken}\\b`).test(text) && !hasPackContext(text),
    reason: `Expected an explicit ${reference.unit} context.`,
  };
}

export function unitUnverifiedFinding(item: ExtractedItemRow, reference: ReferenceItemRow) {
  return {
    document_id: item.document_id,
    finding_type: "unit_unverified" as const,
    title: `Unit could not be verified: ${item.name}`,
    description:
      `Unit could not be verified for this comparison. The bill text does not clearly show ` +
      `the same sale unit or pack context as the reference row (${reference.unit ?? "unit not stated"}, ` +
      `${reference.source_name}). ` +
      `No price-overcharge comparison was made. This is worth checking with the hospital or ` +
      `pharmacist, including whether the line is per tablet, vial, ml, pack, or another unit.`,
    evidence: withLineage({
      item: item.name,
      reference_unit: reference.unit,
      source: reference.source_name,
      source_url: reference.source_url,
      page: item.source_page,
      original_text: item.raw_text,
    }, itemLineage(item, "audit.reference.unit-compatibility", {
      field: "unit_price",
      referenceItemId: reference.id,
    })),
    confidence: "low" as const,
    related_item_id: item.id,
  };
}
