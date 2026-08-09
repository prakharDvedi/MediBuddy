import assert from "node:assert/strict";
import test from "node:test";
import { adaptPmbiRows } from "../lib/reference/ingestion.ts";
import { pmbiMetadata, pmbiSlice } from "./fixtures/pmbi-fixtures.ts";

test("expanded PMBI slice preserves pack semantics, categories, and source pages", () => {
  const adapted = adaptPmbiRows(pmbiSlice, pmbiMetadata);
  const categories = new Set(adapted.rows.map((row) => row.raw_source.groupName));
  const packUnits = new Set(adapted.rows.map((row) => row.pack_unit));
  const paracetamol = adapted.rows.find((row) => row.source_record_id === "product_id:23");

  assert.deepEqual(adapted.issues, []);
  assert.ok(adapted.rows.length >= 50 && adapted.rows.length <= 100);
  assert.ok(categories.size >= 12);
  assert.ok(packUnits.has("tablet_or_capsule"));
  assert.ok(packUnits.has("vial"));
  assert.ok(packUnits.has("vial_with_wfi"));
  assert.ok(packUnits.has("ml"));
  assert.ok(packUnits.has("g"));
  assert.equal(paracetamol?.amount, 4.51);
  assert.equal(paracetamol?.pack_quantity, 10);
  assert.equal(paracetamol?.raw_source.page, 1);
  assert.equal(paracetamol?.effective_date, null);

  const correctedCombination = adapted.rows.find((row) => row.source_record_id === "product_id:181");
  assert.equal(correctedCombination?.canonical_name, "Tricholine Citrate 275 mg + Cyproheptadine 2 mg syrup");
  assert.equal(correctedCombination?.raw_source.genericName, "TRICHOLINE CITRATE 275 mg+ CYPROHEPTADINE");
});

test("PMBI normalization removes a duplicated source pack suffix from identity", () => {
  const adapted = adaptPmbiRows([{
    productId: "23",
    genericName: "Paracetamol Tablets IP 500mg 10's",
    unitSize: "10's",
    mrp: 4.51,
  }], pmbiMetadata);

  assert.deepEqual(adapted.issues, []);
  assert.equal(adapted.rows[0].canonical_name, "Paracetamol Tablets IP 500mg");
  assert.equal(adapted.rows[0].normalized_identity, "paracetamol 500 mg tablet");
});
