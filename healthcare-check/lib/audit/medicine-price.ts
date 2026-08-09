import { normalizeMedicineIdentity } from "../medicines/normalize.ts";
import type { MedicinePriceObservation, MedicineResolution, NormalizedMedicineIdentity } from "../medicines/types.ts";
import type { ExtractedItemRow, Finding } from "./types";

const OVERAGE_THRESHOLD = 1.2;

export type MedicineUnitCheck = {
  compatible: boolean;
  reason: string;
  bill_context: string | null;
};

export type MedicineProductRow = {
  id: string;
  canonical_name: string;
  normalized_identity: string;
  dosage_form: string | null;
  route: string | null;
};

function itemText(item: ExtractedItemRow): string {
  return [item.name, item.raw_text].filter(Boolean).join(" ").toLowerCase();
}

function packFromText(text: string): { quantity: number; unit: string } | null {
  const explicit = text.match(/\b(?:pack|strip|box)\s*(?:of\s*)?(\d+)\s*(tablet|tablets|capsule|capsules|vial|vials|ml)\b/i);
  if (explicit) return { quantity: Number(explicit[1]), unit: explicit[2].replace(/s$/, "").toLowerCase() };
  const count = text.match(/\b(\d+)\s*(tablet|tablets|capsule|capsules|vial|vials)\b/i);
  if (count && Number(count[1]) > 1) return { quantity: Number(count[1]), unit: count[2].replace(/s$/, "").toLowerCase() };
  return null;
}

function normalizedPackUnit(unit: string | null): string | null {
  if (!unit) return null;
  const normalized = unit.toLowerCase().replace(/s$/, "");
  if (normalized === "tablets" || normalized === "tablet") return "tablet";
  if (normalized === "capsules" || normalized === "capsule") return "capsule";
  if (normalized === "vials" || normalized === "vial") return "vial";
  if (normalized === "milliliter" || normalized === "milliliters") return "ml";
  return normalized;
}

function identityFromItem(item: ExtractedItemRow): NormalizedMedicineIdentity {
  return normalizeMedicineIdentity(
    item.medicine_identity as Parameters<typeof normalizeMedicineIdentity>[0],
    item.name,
    item.normalized_name,
  );
}

function billPack(item: ExtractedItemRow, identity: NormalizedMedicineIdentity): { quantity: number; unit: string } | null {
  if (identity.pack_quantity != null && identity.pack_unit) {
    return { quantity: identity.pack_quantity, unit: normalizedPackUnit(identity.pack_unit) ?? identity.pack_unit };
  }
  return packFromText(itemText(item));
}

function expectedNppaUnit(
  item: ExtractedItemRow,
  identity: NormalizedMedicineIdentity,
  observation: MedicinePriceObservation,
): MedicineUnitCheck {
  const text = itemText(item);
  const form = identity.dosage_form;
  const unit = observation.sale_unit.toLowerCase().replace(/\s+/g, " ").trim();

  if (unit === "1 tablet") {
    return {
      compatible: form === "tablet" && !packFromText(text),
      reason: "NPPA observation is per tablet; the bill must identify a single tablet rather than a pack.",
      bill_context: form === "tablet" ? "single tablet" : null,
    };
  }
  if (unit === "1 capsule") {
    return {
      compatible: form === "capsule" && !packFromText(text),
      reason: "NPPA observation is per capsule; the bill must identify a single capsule rather than a pack.",
      bill_context: form === "capsule" ? "single capsule" : null,
    };
  }
  if (unit === "each vial") {
    const explicitlyVial = identity.pack_unit === "vial" || /\b(?:each\s+)?vial\b/i.test(text);
    return {
      compatible: (form === "injection" || form === "powder for injection") && explicitlyVial,
      reason: "NPPA observation is per vial; an injection without explicit vial context is not enough.",
      bill_context: explicitlyVial ? "vial" : null,
    };
  }
  if (unit === "1 ml") {
    const explicitlyMl = identity.pack_unit === "ml" || /\b(?:per\s*|\/\s*)?\d+(?:\.\d+)?\s*ml\b/i.test(text);
    return {
      compatible: explicitlyMl && !/\b(?:vial|bottle|pack|100\s*ml|50\s*ml)\b/i.test(text),
      reason: "NPPA observation is per ml; a bill charged per vial or larger bottle cannot be compared to it.",
      bill_context: explicitlyMl ? "per ml" : null,
    };
  }
  if (unit === "2 ml pack") {
    const pack = billPack(item, identity);
    return {
      compatible: Boolean(pack && pack.quantity === 2 && normalizedPackUnit(pack.unit) === "ml"),
      reason: "NPPA observation is for a 2 ml pack; the bill must state the same pack size.",
      bill_context: pack ? `${pack.quantity} ${pack.unit} pack` : null,
    };
  }

  return { compatible: false, reason: `The NPPA unit '${observation.sale_unit}' is not recognized safely.`, bill_context: null };
}

function expectedPmbiUnit(
  item: ExtractedItemRow,
  identity: NormalizedMedicineIdentity,
  observation: MedicinePriceObservation,
): MedicineUnitCheck {
  const pack = billPack(item, identity);
  if (!pack || observation.pack_quantity == null || !observation.pack_unit) {
    return {
      compatible: false,
      reason: "Jan Aushadhi MRP is a pack price; the bill does not provide enough pack context to compare it.",
      bill_context: null,
    };
  }
  const sourceUnit = observation.pack_unit === "tablet_or_capsule" ? identity.dosage_form : observation.pack_unit;
  const billUnit = normalizedPackUnit(pack.unit);
  const unitMatches = sourceUnit === "vial_with_wfi"
    ? billUnit === "vial" && /\b(?:wfi|water for injection)\b/i.test(itemText(item))
    : sourceUnit === billUnit;
  return {
    compatible: unitMatches && pack.quantity === observation.pack_quantity,
    reason: `Jan Aushadhi MRP applies to ${observation.pack_quantity} ${observation.pack_unit}; the bill must state the same pack context.`,
    bill_context: `${pack.quantity} ${pack.unit}`,
  };
}

export function verifyMedicineObservationUnit(
  item: ExtractedItemRow,
  observation: MedicinePriceObservation,
): MedicineUnitCheck {
  const identity = identityFromItem(item);
  return observation.source_kind === "nppa"
    ? expectedNppaUnit(item, identity, observation)
    : expectedPmbiUnit(item, identity, observation);
}

function sourceLabel(observation: MedicinePriceObservation): string {
  return observation.source_kind === "nppa" ? "NPPA ceiling price" : "Jan Aushadhi MRP";
}

function formattedSource(observation: MedicinePriceObservation, unitCheck: MedicineUnitCheck) {
  return {
    source_kind: observation.source_kind,
    label: sourceLabel(observation),
    amount: observation.amount,
    currency: observation.currency,
    sale_unit: observation.sale_unit,
    pack_text: observation.pack_text,
    pack_quantity: observation.pack_quantity,
    pack_unit: observation.pack_unit,
    tax_status: observation.tax_status,
    effective_date: observation.effective_date,
    observed_at: observation.observed_at,
    source: observation.source_name,
    source_url: observation.source_url,
    unit_compatible: unitCheck.compatible,
    unit_reason: unitCheck.reason,
  };
}

function unitFinding(
  item: ExtractedItemRow,
  observation: MedicinePriceObservation,
  unitCheck: MedicineUnitCheck,
  resolution: MedicineResolution,
): Finding {
  return {
    document_id: item.document_id,
    finding_type: "unit_unverified",
    title: `Unit could not be verified: ${item.name}`,
    description:
      `Unit could not be verified for this comparison. The bill does not clearly show the same ` +
      `${observation.source_kind === "nppa" ? "sale unit" : "pack context"} as the ${sourceLabel(observation)}. ` +
      `No price difference was calculated. This is worth checking with the hospital or pharmacist.`,
    evidence: {
      item: item.name,
      medicine_identity: resolution.identity.canonical_text,
      match_method: resolution.method,
      match_reason: resolution.reason,
      source: observation.source_name,
      source_url: observation.source_url,
      reference_unit: observation.sale_unit,
      unit_reason: unitCheck.reason,
      page: item.source_page,
      original_text: item.raw_text,
    },
    confidence: "low",
    related_item_id: item.id,
  };
}

export function checkMedicinePriceObservations(
  items: ExtractedItemRow[],
  resolutions: Map<string, MedicineResolution>,
  observations: MedicinePriceObservation[],
): Finding[] {
  const observationsByProduct = new Map<string, MedicinePriceObservation[]>();
  for (const observation of observations) {
    const list = observationsByProduct.get(observation.medicine_product_id) ?? [];
    list.push(observation);
    observationsByProduct.set(observation.medicine_product_id, list);
  }

  const findings: Finding[] = [];
  for (const item of items) {
    if (item.item_type !== "medicine" || item.unit_price == null) continue;
    const hospitalPrice = item.unit_price;
    const resolution = resolutions.get(item.id);
    if (!resolution?.product_id || resolution.status === "needs_review" || resolution.status === "unresolved" || resolution.status === "combination_unresolved") continue;

    const productObservations = observationsByProduct.get(resolution.product_id) ?? [];
    const comparable: Array<{ observation: MedicinePriceObservation; check: MedicineUnitCheck; difference: number }> = [];
    const incompatibleNppa = productObservations.find((observation) => {
      if (observation.source_kind !== "nppa") return false;
      return !verifyMedicineObservationUnit(item, observation).compatible;
    });

    for (const observation of productObservations) {
      const check = verifyMedicineObservationUnit(item, observation);
      if (!check.compatible) continue;
      const quantity = item.quantity ?? 1;
      const difference = Number(((hospitalPrice - observation.amount) * quantity).toFixed(2));
      if (difference > 0) comparable.push({ observation, check, difference });
    }

    const aboveThreshold = comparable.filter(({ observation }) => hospitalPrice > observation.amount * OVERAGE_THRESHOLD);
    if (!aboveThreshold.length) {
      if (!comparable.length && incompatibleNppa) findings.push(unitFinding(item, incompatibleNppa, verifyMedicineObservationUnit(item, incompatibleNppa), resolution));
      continue;
    }

    const primary = aboveThreshold.find(({ observation }) => observation.source_kind === "nppa") ?? aboveThreshold[0];
    const primaryIsNppa = primary.observation.source_kind === "nppa";
    const sourceEvidence = productObservations.map((observation) => formattedSource(observation, verifyMedicineObservationUnit(item, observation)));
    const potentialSavings = primaryIsNppa ? primary.difference : undefined;
    const potentialPriceDifference = primary.difference;
    const quantity = item.quantity ?? 1;
    const primaryLabel = sourceLabel(primary.observation);

    findings.push({
      document_id: item.document_id,
      finding_type: "medicine_savings",
      title: `${primaryIsNppa ? "Potential savings" : "Potential price difference"} worth investigating: ${item.name}`,
      description:
        `Hospital price: ₹${item.unit_price} per verified unit. ${primaryLabel}: ` +
        `₹${primary.observation.amount} / ${primary.observation.sale_unit}. ` +
        `${primaryIsNppa ? "Potential savings" : "Potential price difference"}: ₹${potentialPriceDifference}. ` +
        `This is worth investigating with the hospital or pharmacist. Estimated from the available reference price. ` +
        `This does not guarantee that this amount is recoverable or that the hospital charge is unlawful.`,
      evidence: {
        item: item.name,
        medicine_identity: resolution.identity.canonical_text,
        match_method: resolution.method,
        match_reason: resolution.reason,
        hospital_price: hospitalPrice,
        hospital_unit: primary.check.bill_context,
        reference_price: primary.observation.amount,
        reference_unit: primary.observation.sale_unit,
        quantity,
        potential_price_difference: potentialPriceDifference,
        ...(potentialSavings != null ? { potential_savings: potentialSavings } : {}),
        price_observations: sourceEvidence,
        page: item.source_page,
        original_text: item.raw_text,
      },
      confidence: item.confidence === "low" ? "low" : primaryIsNppa ? "medium" : "low",
      related_item_id: item.id,
    });
  }

  return findings;
}
