import assert from "node:assert/strict";
import test from "node:test";
import {
  adaptNppaRows,
  adaptPmbiRows,
  freshnessStatus,
  snapshotContentHash,
  type AdaptedSnapshot,
  type SourceMetadata,
} from "../lib/reference/ingestion.ts";
import { selectCurrentMedicineObservations } from "../lib/reference/versioning.ts";
import type { MedicinePriceObservation, ReferenceSnapshotRow } from "../lib/medicines/types.ts";

const metadata: SourceMetadata = {
  sourceKind: "nppa",
  sourceName: "Test NPPA",
  sourceUrl: "https://example.test/nppa",
  retrievedAt: "2026-08-10T00:00:00.000Z",
  effectiveDate: "2026-03-25",
};

function observation(overrides: Partial<MedicinePriceObservation> = {}): MedicinePriceObservation {
  return {
    id: "observation",
    snapshot_id: null,
    medicine_product_id: "product",
    source_kind: "nppa",
    source_record_id: "record",
    price_kind: "ceiling_price",
    amount: 10,
    currency: "INR",
    sale_unit: "1 tablet",
    pack_text: "1 Tablet",
    pack_quantity: 1,
    pack_unit: "tablet",
    tax_status: "excluded",
    effective_date: "2026-03-25",
    observed_at: "2026-08-10T00:00:00.000Z",
    source_name: "Test NPPA",
    source_url: "https://example.test/nppa",
    raw_source: {},
    ...overrides,
  };
}

function snapshot(overrides: Partial<ReferenceSnapshotRow> = {}): ReferenceSnapshotRow {
  return {
    id: "snapshot-1",
    source_kind: "nppa",
    status: "accepted",
    retrieved_at: "2026-08-10T00:00:00.000Z",
    ...overrides,
  };
}

test("NPPA adapter normalizes identity, sale unit, provenance, and effective date", () => {
  const result = adaptNppaRows([
    {
      formulation: "PARACETAMOL",
      strength: "TABLET 500 MG",
      price: 0.93,
      unit: "1 Tablet",
      rawSourcePrice: "₹ 0.93(1 Tablet)",
    },
  ], metadata);

  assert.deepEqual(result.issues, []);
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].normalized_identity, "paracetamol 500 mg tablet");
  assert.equal(result.rows[0].sale_unit, "1 tablet");
  assert.equal(result.rows[0].pack_quantity, 1);
  assert.equal(result.rows[0].effective_date, "2026-03-25");
  assert.equal(result.rows[0].raw_source.rawSourcePrice, "₹ 0.93(1 Tablet)");
});

test("NPPA validation rejects unsupported units, non-positive prices, and duplicate records", () => {
  const result = adaptNppaRows([
    { sourceRecordId: "same", formulation: "A", strength: "TABLET 500 MG", price: 1, unit: "1 Tablet" },
    { sourceRecordId: "same", formulation: "B", strength: "TABLET 500 MG", price: 1, unit: "1 Tablet" },
  ], metadata);

  assert.equal(result.rows.length, 1);
  assert.ok(result.issues.some((issue) => issue.field === "sourceRecordId"));

  const unsupportedUnit = adaptNppaRows([
    { sourceRecordId: "unit", formulation: "B", strength: "TABLET 500 MG", price: 1, unit: "box" },
  ], metadata);
  assert.ok(unsupportedUnit.issues.some((issue) => issue.field === "unit"));

  const invalidPrice = adaptNppaRows([
    { sourceRecordId: "price", formulation: "A", strength: "TABLET 500 MG", price: 0, unit: "1 Tablet" },
  ], metadata);
  assert.ok(invalidPrice.issues.some((issue) => issue.field === "price"));
});

test("PMBI adapter preserves pack semantics and keeps missing effective dates honest", () => {
  const result = adaptPmbiRows([
    {
      productId: "982",
      drugCode: "23",
      genericName: "Paracetamol Tablets IP 500 mg",
      unitSize: "10's",
      mrp: 6.56,
      groupName: "Analgesics",
    },
    {
      productId: "811",
      genericName: "Pantoprazole Injection 40mg",
      unitSize: "Vial",
      mrp: 23.83,
      groupName: "Gastrointestinal",
    },
  ], {
    ...metadata,
    sourceKind: "pmbi",
    sourceName: "Test PMBI",
    sourceUrl: "https://example.test/pmbi",
    effectiveDate: null,
  });

  assert.deepEqual(result.issues, []);
  assert.equal(result.rows.length, 2);
  assert.equal(result.rows[0].source_record_id, "product_id:982");
  assert.equal(result.rows[0].sale_unit, "pack");
  assert.equal(result.rows[0].pack_quantity, 10);
  assert.equal(result.rows[0].pack_unit, "tablet_or_capsule");
  assert.equal(result.rows[0].effective_date, null);
  assert.equal(result.rows[1].pack_unit, "vial");
});

test("snapshot hash is order-independent but changes when a source value changes", () => {
  const first = adaptNppaRows([
    { sourceRecordId: "b", formulation: "B", strength: "TABLET 500 MG", price: 2, unit: "1 Tablet" },
    { sourceRecordId: "a", formulation: "A", strength: "TABLET 500 MG", price: 1, unit: "1 Tablet" },
  ], metadata);
  const second = adaptNppaRows([
    { sourceRecordId: "a", formulation: "A", strength: "TABLET 500 MG", price: 1, unit: "1 Tablet" },
    { sourceRecordId: "b", formulation: "B", strength: "TABLET 500 MG", price: 2, unit: "1 Tablet" },
  ], metadata);
  const changed = adaptNppaRows([
    { sourceRecordId: "a", formulation: "A", strength: "TABLET 500 MG", price: 1.1, unit: "1 Tablet" },
    { sourceRecordId: "b", formulation: "B", strength: "TABLET 500 MG", price: 2, unit: "1 Tablet" },
  ], metadata);

  assert.equal(snapshotContentHash(first), snapshotContentHash(second));
  assert.notEqual(snapshotContentHash(first), snapshotContentHash(changed));
});

test("freshness classifies valid snapshots and refuses to guess for invalid timestamps", () => {
  const now = new Date("2026-08-10T00:00:00.000Z");
  assert.equal(freshnessStatus("2026-08-01T00:00:00.000Z", now, 30), "fresh");
  assert.equal(freshnessStatus("2026-06-01T00:00:00.000Z", now, 30), "stale");
  assert.equal(freshnessStatus(null, now, 30), "unknown");
});

test("version selection ignores staged/rejected snapshots and chooses the latest accepted record", () => {
  const observations = [
    observation({ id: "old", snapshot_id: "snapshot-old", amount: 10, observed_at: "2026-08-01T00:00:00.000Z" }),
    observation({ id: "new", snapshot_id: "snapshot-new", amount: 12, observed_at: "2026-08-10T00:00:00.000Z" }),
    observation({ id: "staged", snapshot_id: "snapshot-staged", amount: 99 }),
    observation({ id: "legacy", snapshot_id: null, source_record_id: "legacy-record", amount: 8 }),
  ];
  const snapshots = [
    snapshot({ id: "snapshot-old", retrieved_at: "2026-08-01T00:00:00.000Z" }),
    snapshot({ id: "snapshot-new", retrieved_at: "2026-08-10T00:00:00.000Z" }),
    snapshot({ id: "snapshot-staged", status: "staged", retrieved_at: "2026-08-11T00:00:00.000Z" }),
  ];

  const current = selectCurrentMedicineObservations(observations, snapshots);
  assert.deepEqual(current.map((row) => [row.source_record_id, row.amount]), [["legacy-record", 8], ["record", 12]]);
});

test("adapted snapshots carry source metadata required for versioned persistence", () => {
  const result: AdaptedSnapshot = adaptNppaRows([
    { formulation: "A", strength: "TABLET 500 MG", price: 1, unit: "1 Tablet" },
  ], metadata);
  assert.equal(result.metadata.sourceKind, "nppa");
  assert.equal(result.metadata.retrievedAt, "2026-08-10T00:00:00.000Z");
});
