import { createHash } from "node:crypto";
import { normalizeMedicineIdentity, normalizeText } from "../medicines/normalize.ts";
import type { ExtractedMedicineIdentity, MedicinePriceObservation, ReferenceSnapshotRow } from "../medicines/types.ts";

export type SourceKind = "nppa" | "pmbi" | "cghs";
export type SnapshotStatus = "staged" | "accepted" | "rejected";
export type FreshnessStatus = "fresh" | "stale" | "unknown";

export type SourceMetadata = {
  sourceKind: SourceKind;
  sourceName: string;
  sourceUrl: string;
  retrievedAt: string;
  effectiveDate: string | null;
};

export type NppaSourceRow = {
  sourceRecordId?: string;
  formulation: string;
  strength: string;
  price: number;
  unit: string;
  rawSourcePrice?: string | null;
  effectiveDate?: string | null;
};

export type PmbiSourceRow = {
  productId: string;
  drugCode?: string | null;
  genericName: string;
  unitSize: string;
  mrp: number;
  groupName?: string | null;
};

export type PreparedMedicineObservation = {
  source_kind: SourceKind;
  source_record_id: string;
  canonical_name: string;
  normalized_identity: string;
  identity: ExtractedMedicineIdentity;
  dosage_form: string | null;
  route: string | null;
  price_kind: MedicinePriceObservation["price_kind"];
  amount: number;
  currency: "INR";
  sale_unit: string;
  pack_text: string | null;
  pack_quantity: number | null;
  pack_unit: string | null;
  tax_status: MedicinePriceObservation["tax_status"];
  effective_date: string | null;
  observed_at: string;
  source_name: string;
  source_url: string;
  raw_source: Record<string, unknown>;
};

export type ValidationIssue = {
  row: number;
  field: string;
  message: string;
};

export type AdaptedSnapshot = {
  metadata: SourceMetadata;
  rows: PreparedMedicineObservation[];
  issues: ValidationIssue[];
};

type UnitInfo = {
  saleUnit: string;
  packQuantity: number;
  packUnit: string;
};

function isValidTimestamp(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

export function validateSourceMetadata(metadata: SourceMetadata): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!metadata.sourceName.trim()) issues.push({ row: 0, field: "sourceName", message: "Source name is required." });
  try {
    const url = new URL(metadata.sourceUrl);
    if (!/^https?:$/.test(url.protocol)) throw new Error("unsupported protocol");
  } catch {
    issues.push({ row: 0, field: "sourceUrl", message: "Source URL must be a valid HTTP(S) URL." });
  }
  if (!isValidTimestamp(metadata.retrievedAt)) {
    issues.push({ row: 0, field: "retrievedAt", message: "Retrieved timestamp must be parseable." });
  }
  if (metadata.effectiveDate && !/^\d{4}-\d{2}-\d{2}$/.test(metadata.effectiveDate)) {
    issues.push({ row: 0, field: "effectiveDate", message: "Effective date must use YYYY-MM-DD." });
  }
  return issues;
}

function normalizedIdentityParts(canonicalName: string): {
  normalizedIdentity: string;
  identity: ExtractedMedicineIdentity;
  dosageForm: string | null;
  route: string | null;
} {
  const normalized = normalizeMedicineIdentity(null, canonicalName, canonicalName);
  const components = normalized.components.map((component) => ({
    ingredient_name: component.ingredient_name,
    strength_value: component.strength_value,
    strength_unit: component.strength_unit,
    denominator_value: component.denominator_value,
    denominator_unit: component.denominator_unit,
  }));
  const dosageForm = normalized.dosage_form;
  const route = dosageForm === "injection" || dosageForm === "powder for injection"
    ? "injectable"
    : dosageForm
      ? "oral"
      : null;
  return {
    normalizedIdentity: normalized.canonical_text,
    identity: {
      brand_name: null,
      components,
      dosage_form: dosageForm,
      route,
      pack_text: null,
      pack_quantity: null,
      pack_unit: null,
    },
    dosageForm,
    route,
  };
}

function nppaUnit(value: string): UnitInfo | null {
  const normalized = normalizeText(value).replace(/\s+/g, " ");
  const units: Record<string, UnitInfo> = {
    "1 tablet": { saleUnit: "1 tablet", packQuantity: 1, packUnit: "tablet" },
    "1 capsule": { saleUnit: "1 capsule", packQuantity: 1, packUnit: "capsule" },
    "1 suppository": { saleUnit: "1 suppository", packQuantity: 1, packUnit: "suppository" },
    "each vial": { saleUnit: "each vial", packQuantity: 1, packUnit: "vial" },
    "1 ml": { saleUnit: "1 ml", packQuantity: 1, packUnit: "ml" },
    "2 ml pack": { saleUnit: "2 ml pack", packQuantity: 2, packUnit: "ml" },
  };
  return units[normalized] ?? null;
}

function pmbiUnit(value: string): UnitInfo | null {
  const normalized = value.trim();
  const packMatch = normalized.match(/^(\d+)'s$/i);
  if (packMatch) return { saleUnit: "pack", packQuantity: Number(packMatch[1]), packUnit: "tablet_or_capsule" };
  if (normalized.toLowerCase() === "vial") return { saleUnit: "pack", packQuantity: 1, packUnit: "vial" };
  if (normalized.toLowerCase() === "vial & wfi") return { saleUnit: "pack", packQuantity: 1, packUnit: "vial_with_wfi" };
  return null;
}

export function adaptNppaRows(rows: NppaSourceRow[], metadata: SourceMetadata): AdaptedSnapshot {
  const issues = validateSourceMetadata(metadata);
  const prepared: PreparedMedicineObservation[] = [];
  const seenRecordIds = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 1;
    const canonicalName = `${row.formulation ?? ""} ${row.strength ?? ""}`.trim();
    const unit = nppaUnit(row.unit ?? "");
    const effectiveDate = row.effectiveDate ?? metadata.effectiveDate;
    if (!canonicalName) issues.push({ row: rowNumber, field: "formulation/strength", message: "Medicine identity is required." });
    if (!Number.isFinite(row.price) || row.price <= 0) issues.push({ row: rowNumber, field: "price", message: "Price must be a positive number." });
    if (!unit) issues.push({ row: rowNumber, field: "unit", message: `Unsupported NPPA sale unit: ${row.unit}` });
    if (!effectiveDate) issues.push({ row: rowNumber, field: "effectiveDate", message: "NPPA rows require an effective date." });
    if (effectiveDate && !/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate)) issues.push({ row: rowNumber, field: "effectiveDate", message: "Effective date must use YYYY-MM-DD." });
    if (!canonicalName || !unit || !Number.isFinite(row.price) || row.price <= 0 || !effectiveDate) return;

    const parts = normalizedIdentityParts(canonicalName);
    const sourceRecordId = row.sourceRecordId?.trim() || `identity:${parts.normalizedIdentity}|unit:${unit.saleUnit}`;
    if (seenRecordIds.has(sourceRecordId)) {
      issues.push({ row: rowNumber, field: "sourceRecordId", message: `Duplicate source record ID: ${sourceRecordId}` });
      return;
    }
    seenRecordIds.add(sourceRecordId);
    prepared.push({
      source_kind: "nppa",
      source_record_id: sourceRecordId,
      canonical_name: canonicalName,
      normalized_identity: parts.normalizedIdentity,
      identity: { ...parts.identity, pack_text: row.unit, pack_quantity: unit.packQuantity, pack_unit: unit.packUnit },
      dosage_form: parts.dosageForm,
      route: parts.route,
      price_kind: "ceiling_price",
      amount: row.price,
      currency: "INR",
      sale_unit: unit.saleUnit,
      pack_text: row.unit,
      pack_quantity: unit.packQuantity,
      pack_unit: unit.packUnit,
      tax_status: "excluded",
      effective_date: effectiveDate,
      observed_at: metadata.retrievedAt,
      source_name: metadata.sourceName,
      source_url: metadata.sourceUrl,
      raw_source: { ...row, source_record_id: sourceRecordId },
    });
  });

  return { metadata, rows: prepared, issues };
}

export function adaptPmbiRows(rows: PmbiSourceRow[], metadata: SourceMetadata): AdaptedSnapshot {
  const issues = validateSourceMetadata(metadata);
  const prepared: PreparedMedicineObservation[] = [];
  const seenRecordIds = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 1;
    const unit = pmbiUnit(row.unitSize ?? "");
    const canonicalName = row.genericName?.trim() ?? "";
    const sourceRecordId = row.productId?.trim() ? `product_id:${row.productId.trim()}` : "";
    if (!sourceRecordId) issues.push({ row: rowNumber, field: "productId", message: "PMBI product ID is required." });
    if (!canonicalName) issues.push({ row: rowNumber, field: "genericName", message: "Generic name is required." });
    if (!Number.isFinite(row.mrp) || row.mrp <= 0) issues.push({ row: rowNumber, field: "mrp", message: "MRP must be a positive number." });
    if (!unit) issues.push({ row: rowNumber, field: "unitSize", message: `Unsupported PMBI unit size: ${row.unitSize}` });
    if (!sourceRecordId || !canonicalName || !unit || !Number.isFinite(row.mrp) || row.mrp <= 0) return;
    if (seenRecordIds.has(sourceRecordId)) {
      issues.push({ row: rowNumber, field: "productId", message: `Duplicate PMBI product ID: ${row.productId}` });
      return;
    }
    seenRecordIds.add(sourceRecordId);

    const parts = normalizedIdentityParts(canonicalName);
    prepared.push({
      source_kind: "pmbi",
      source_record_id: sourceRecordId,
      canonical_name: canonicalName,
      normalized_identity: parts.normalizedIdentity,
      identity: { ...parts.identity, pack_text: row.unitSize, pack_quantity: unit.packQuantity, pack_unit: unit.packUnit },
      dosage_form: parts.dosageForm,
      route: parts.route,
      price_kind: "listed_mrp",
      amount: row.mrp,
      currency: "INR",
      sale_unit: unit.saleUnit,
      pack_text: row.unitSize,
      pack_quantity: unit.packQuantity,
      pack_unit: unit.packUnit,
      tax_status: "unknown",
      effective_date: metadata.effectiveDate,
      observed_at: metadata.retrievedAt,
      source_name: metadata.sourceName,
      source_url: metadata.sourceUrl,
      raw_source: { ...row, source_record_id: sourceRecordId },
    });
  });

  return { metadata, rows: prepared, issues };
}

export function snapshotContentHash(snapshot: AdaptedSnapshot): string {
  const payload = {
    source_kind: snapshot.metadata.sourceKind,
    effective_date: snapshot.metadata.effectiveDate,
    rows: [...snapshot.rows].sort((a, b) => a.source_record_id.localeCompare(b.source_record_id)),
  };
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export function freshnessStatus(
  retrievedAt: string | null | undefined,
  now = new Date(),
  maxAgeDays = 30,
): FreshnessStatus {
  if (!retrievedAt || !isValidTimestamp(retrievedAt)) return "unknown";
  const ageMs = now.getTime() - Date.parse(retrievedAt);
  return ageMs >= 0 && ageMs <= maxAgeDays * 24 * 60 * 60 * 1000 ? "fresh" : "stale";
}

export type { MedicinePriceObservation, ReferenceSnapshotRow };
