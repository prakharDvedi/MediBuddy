import { createHash } from "node:crypto";
import { normalizeText } from "../medicines/normalize.ts";
import { validateSourceMetadata, type SourceMetadata, type ValidationIssue } from "./ingestion.ts";

export type CghsRecordKind = "procedure" | "package";

export type CghsSourceRow = {
  sourceRecordId?: string;
  code: string;
  recordKind: CghsRecordKind;
  category: string;
  description: string;
  rate: number;
  rateUnit: string;
  rateContext: string;
  roomType?: string | null;
  inclusionNotes?: string | null;
  exclusionNotes?: string | null;
  applicabilityConditions?: string | null;
  sourcePage?: number | null;
  sourceSection?: string | null;
};

export type PreparedCghsRecord = {
  source_kind: "cghs";
  source_record_id: string;
  code: string;
  record_kind: CghsRecordKind;
  category: string;
  description: string;
  normalized_name: string;
  rate: number;
  rate_unit: string;
  rate_context: string;
  room_type: string | null;
  inclusion_notes: string | null;
  exclusion_notes: string | null;
  applicability_conditions: string | null;
  source_page: number | null;
  source_section: string | null;
  effective_date: string;
  observed_at: string;
  source_name: string;
  source_url: string;
  raw_source: Record<string, unknown>;
};

export type AdaptedCghsSnapshot = {
  metadata: SourceMetadata;
  rows: PreparedCghsRecord[];
  issues: ValidationIssue[];
};

function isDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function adaptCghsRows(rows: CghsSourceRow[], metadata: SourceMetadata): AdaptedCghsSnapshot {
  const issues = validateSourceMetadata(metadata);
  const prepared: PreparedCghsRecord[] = [];
  const seenRecordIds = new Set<string>();

  if (metadata.sourceKind !== "cghs") {
    issues.push({ row: 0, field: "sourceKind", message: "CGHS snapshots must use sourceKind cghs." });
  }
  if (!metadata.effectiveDate || !isDate(metadata.effectiveDate)) {
    issues.push({ row: 0, field: "effectiveDate", message: "CGHS snapshots require an effective date in YYYY-MM-DD format." });
  }

  rows.forEach((row, index) => {
    const rowNumber = index + 1;
    const code = row.code?.trim() ?? "";
    const category = row.category?.trim() ?? "";
    const description = row.description?.trim() ?? "";
    const rateUnit = row.rateUnit?.trim() ?? "";
    const rateContext = row.rateContext?.trim() ?? "";
    const sourceRecordId = row.sourceRecordId?.trim() || `${code}:${normalizeText(rateContext)}`;
    const recordKind = row.recordKind;

    if (!code) issues.push({ row: rowNumber, field: "code", message: "CGHS code is required." });
    if (!category) issues.push({ row: rowNumber, field: "category", message: "CGHS category is required." });
    if (!description) issues.push({ row: rowNumber, field: "description", message: "CGHS description is required." });
    if (!rateUnit) issues.push({ row: rowNumber, field: "rateUnit", message: "CGHS rate unit is required." });
    if (!rateContext) issues.push({ row: rowNumber, field: "rateContext", message: "CGHS rate context is required." });
    if (recordKind !== "procedure" && recordKind !== "package") issues.push({ row: rowNumber, field: "recordKind", message: "CGHS record kind must be procedure or package." });
    if (!Number.isFinite(row.rate) || row.rate <= 0) issues.push({ row: rowNumber, field: "rate", message: "CGHS rate must be a positive number." });
    if (row.sourcePage != null && (!Number.isInteger(row.sourcePage) || row.sourcePage < 1)) {
      issues.push({ row: rowNumber, field: "sourcePage", message: "Source page must be a positive integer." });
    }
    if (!sourceRecordId || !code || !category || !description || !rateUnit || !rateContext || (recordKind !== "procedure" && recordKind !== "package") || !Number.isFinite(row.rate) || row.rate <= 0 || !metadata.effectiveDate || !isDate(metadata.effectiveDate)) return;
    if (seenRecordIds.has(sourceRecordId)) {
      issues.push({ row: rowNumber, field: "sourceRecordId", message: `Duplicate CGHS source record ID: ${sourceRecordId}` });
      return;
    }
    seenRecordIds.add(sourceRecordId);

    prepared.push({
      source_kind: "cghs",
      source_record_id: sourceRecordId,
      code,
      record_kind: recordKind,
      category,
      description,
      normalized_name: normalizeText(description),
      rate: row.rate,
      rate_unit: rateUnit,
      rate_context: rateContext,
      room_type: row.roomType?.trim() || null,
      inclusion_notes: row.inclusionNotes?.trim() || null,
      exclusion_notes: row.exclusionNotes?.trim() || null,
      applicability_conditions: row.applicabilityConditions?.trim() || null,
      source_page: row.sourcePage ?? null,
      source_section: row.sourceSection?.trim() || null,
      effective_date: metadata.effectiveDate,
      observed_at: metadata.retrievedAt,
      source_name: metadata.sourceName,
      source_url: metadata.sourceUrl,
      raw_source: { ...row, source_record_id: sourceRecordId },
    });
  });

  return { metadata, rows: prepared, issues };
}

export function cghsSnapshotContentHash(snapshot: AdaptedCghsSnapshot): string {
  const canonicalRows = [...snapshot.rows]
    .sort((a, b) => a.source_record_id.localeCompare(b.source_record_id))
    .map((row) => ({
      source_record_id: row.source_record_id,
      code: row.code,
      record_kind: row.record_kind,
      category: row.category,
      description: row.description,
      normalized_name: row.normalized_name,
      rate: row.rate,
      rate_unit: row.rate_unit,
      rate_context: row.rate_context,
      room_type: row.room_type,
      inclusion_notes: row.inclusion_notes,
      exclusion_notes: row.exclusion_notes,
      applicability_conditions: row.applicability_conditions,
      source_page: row.source_page,
      source_section: row.source_section,
      effective_date: row.effective_date,
    }));
  return createHash("sha256")
    .update(JSON.stringify({ source_kind: "cghs", metadata: snapshot.metadata, rows: canonicalRows }))
    .digest("hex");
}
