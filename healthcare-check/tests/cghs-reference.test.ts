import assert from "node:assert/strict";
import test from "node:test";
import { checkCghsPrices } from "../lib/audit/cghs.ts";
import { calculatePotentialSavings } from "../lib/audit/summary.ts";
import type { CghsReferenceRecordRow, ExtractedItemRow } from "../lib/audit/types.ts";
import { adaptCghsRows, cghsSnapshotContentHash } from "../lib/reference/cghs.ts";
import { selectCurrentCghsRecords } from "../lib/reference/cghs-versioning.ts";
import type { ReferenceSnapshotRow } from "../lib/medicines/types.ts";
import { cghsMetadata, cghsSlice } from "./fixtures/cghs-fixtures.ts";

function item(overrides: Partial<ExtractedItemRow> = {}): ExtractedItemRow {
  return {
    id: "item-1",
    document_id: "document-1",
    item_type: "procedure",
    name: "Consultation OPD",
    normalized_name: "consultation opd",
    quantity: 1,
    unit_price: 500,
    total_price: 500,
    source_page: 2,
    raw_text: "Consultation OPD 500",
    confidence: "high",
    medicine_identity: null,
    medicine_product_id: null,
    medicine_match_status: null,
    medicine_match_confidence: null,
    medicine_match_reason: null,
    ...overrides,
  };
}

function snapshot(overrides: Partial<ReferenceSnapshotRow> = {}): ReferenceSnapshotRow {
  return {
    id: "snapshot-1",
    source_kind: "cghs",
    status: "accepted",
    retrieved_at: "2026-08-10T00:00:00.000Z",
    source_name: cghsMetadata.sourceName,
    source_url: cghsMetadata.sourceUrl,
    effective_date: cghsMetadata.effectiveDate,
    ...overrides,
  };
}

function records(snapshotId = "snapshot-1"): CghsReferenceRecordRow[] {
  return adaptCghsRows(cghsSlice, cghsMetadata).rows.map((row, index) => ({
    id: `record-${index}`,
    snapshot_id: snapshotId,
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
    raw_source: row.raw_source,
  }));
}

test("CGHS adapter preserves codes, package semantics, normalization, and source provenance", () => {
  const adapted = adaptCghsRows(cghsSlice, cghsMetadata);
  assert.deepEqual(adapted.issues, []);
  assert.equal(adapted.rows.length, cghsSlice.length);
  assert.equal(adapted.rows[0].code, "CN001");
  assert.equal(adapted.rows[0].normalized_name, "consultation opd");
  assert.equal(adapted.rows.at(-1)?.record_kind, "package");
  assert.equal(adapted.rows.at(-1)?.inclusion_notes, "Source description states including all Consumables.");
  assert.equal(adapted.rows.at(-1)?.source_page, 108);
  assert.equal(adapted.rows.at(-1)?.effective_date, "2025-10-13");
});

test("CGHS validation rejects missing context, invalid rates, duplicate IDs, and bad dates", () => {
  const adapted = adaptCghsRows([
    { ...cghsSlice[0], sourceRecordId: "duplicate", rateContext: "uniform" },
    { ...cghsSlice[1], sourceRecordId: "duplicate", rate: 1 },
    { ...cghsSlice[2], sourceRecordId: "invalid-rate", rate: 0 },
  ], cghsMetadata);
  const badDate = adaptCghsRows([cghsSlice[0]], { ...cghsMetadata, effectiveDate: "2025/10/13" });
  assert.ok(badDate.issues.some((issue) => issue.field === "effectiveDate"));
  assert.ok(adapted.issues.some((issue) => issue.field === "rate"));
  assert.ok(adapted.issues.some((issue) => issue.field === "sourceRecordId"));
});

test("CGHS snapshot hash is stable for row order but changes with rate context", () => {
  const first = adaptCghsRows(cghsSlice, cghsMetadata);
  const second = adaptCghsRows([...cghsSlice].reverse(), cghsMetadata);
  const changed = adaptCghsRows(cghsSlice.map((row) => row.code === "CN001" ? { ...row, rateContext: "semi_private_tier_i_nabh" } : row), cghsMetadata);
  assert.equal(cghsSnapshotContentHash(first), cghsSnapshotContentHash(second));
  assert.notEqual(cghsSnapshotContentHash(first), cghsSnapshotContentHash(changed));
});

test("CGHS version selection keeps only the latest accepted context-specific record", () => {
  const oldRecords = records("snapshot-old");
  const newRecords = records("snapshot-new").map((record) => record.code === "CN001" ? { ...record, rate: 375, id: "record-new" } : record);
  const current = selectCurrentCghsRecords(
    [...oldRecords, ...newRecords],
    [
      snapshot({ id: "snapshot-old", retrieved_at: "2026-08-01T00:00:00.000Z" }),
      snapshot({ id: "snapshot-new", retrieved_at: "2026-08-10T00:00:00.000Z" }),
      snapshot({ id: "snapshot-staged", status: "staged", retrieved_at: "2026-08-11T00:00:00.000Z" }),
    ],
  );
  assert.equal(current.find((record) => record.code === "CN001")?.rate, 375);
  assert.equal(current.some((record) => record.snapshot_id === "snapshot-staged"), false);
});

test("CGHS audit compares uniform context only and preserves evidence lineage", () => {
  const finding = checkCghsPrices([item()], records());
  assert.equal(finding.length, 1);
  assert.equal(finding[0].title, "CGHS reference worth checking: Consultation OPD");
  const lineage = (finding[0].evidence.lineage as { reference: { record_id: string | null; source_kind: string | null }; normalized: { canonical_entity_id: string | null } });
  assert.equal(lineage.reference.record_id, "record-0");
  assert.equal(lineage.reference.source_kind, "cghs");
  assert.equal(lineage.normalized.canonical_entity_id, "CN001");

  const contextualOnly = records().filter((record) => record.code === "BP027");
  assert.equal(checkCghsPrices([item({ name: "Plastic Surgery of the Nose - Minor", normalized_name: "plastic surgery of the nose - minor", unit_price: 50000 })], contextualOnly).length, 0);
  assert.equal(checkCghsPrices([item({ item_type: "service" })], records()).length, 1);
});

test("CGHS findings stay out of the potential-savings summary", () => {
  const [cghsFinding] = checkCghsPrices([item({ item_type: "service" })], records());
  assert.equal(calculatePotentialSavings([cghsFinding]), 0);
  assert.equal(calculatePotentialSavings([
    { finding_type: "medicine_savings", evidence: { potential_savings: 150 } },
  ]), 150);
});
