import type { createClient } from "@/lib/supabase/server";
import type { ExtractedItemRow, ReferenceItemRow, InsurancePolicyRow } from "./types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
import { checkPrices } from "./price";
import { checkMedicineSavings } from "./savings";
import { checkDuplicates } from "./duplicates";
import { checkQuantities } from "./quantity";
import { checkPackageOverlap } from "./package-overlap";
import { checkUnexplained } from "./unexplained";
import { checkInsuranceCoverage } from "./insurance-coverage";
import { resolveMedicineIdentity } from "@/lib/medicines/match";
import { checkMedicinePriceObservations, type MedicineProductRow } from "./medicine-price";
import type { MedicineAliasCandidate, MedicinePriceObservation } from "@/lib/medicines/types";
import { selectCurrentMedicineObservations } from "@/lib/reference/versioning";
import type { ReferenceSnapshotRow } from "@/lib/medicines/types";

/**
 * Runs every deterministic hospital-side check against all items across
 * every document in the case, replacing any findings from a previous run.
 * Pure arithmetic/matching — no LLM calls happen here.
 */
export async function runAuditEngine(
  supabase: SupabaseServerClient,
  caseId: string,
): Promise<{ findingsCount: number }> {
  const { data: documents, error: documentsError } = await supabase
    .from("documents")
    .select("id")
    .eq("case_id", caseId)
    .is("deleted_at", null);
  if (documentsError) throw new Error(documentsError.message);

  const documentIds = (documents ?? []).map((d) => d.id as string);
  if (documentIds.length === 0) {
    return { findingsCount: 0 };
  }

  const { data: items, error: itemsError } = await supabase
    .from("extracted_items")
    .select(
      "id, document_id, item_type, name, normalized_name, quantity, unit_price, total_price, source_page, raw_text, confidence, medicine_identity, medicine_product_id, medicine_match_status, medicine_match_confidence, medicine_match_reason",
    )
    .in("document_id", documentIds);
  if (itemsError) throw new Error(itemsError.message);

  const { data: referenceItems, error: referenceError } = await supabase
    .from("reference_items")
    .select("id, category, name, normalized_name, reference_price, unit, source_name, source_url, medicine_product_id");
  if (referenceError) throw new Error(referenceError.message);

  const { data: medicineProducts, error: productsError } = await supabase
    .from("medicine_products")
    .select("id, canonical_name, normalized_identity, dosage_form, route");
  if (productsError) throw new Error(productsError.message);

  const { data: medicineAliases, error: aliasesError } = await supabase
    .from("medicine_aliases")
    .select("medicine_product_id, normalized_alias, alias_text, confidence, review_status");
  if (aliasesError) throw new Error(aliasesError.message);

  const { data: medicineObservations, error: observationsError } = await supabase
    .from("medicine_price_observations")
    .select(
      "id, snapshot_id, medicine_product_id, source_kind, source_record_id, price_kind, amount, currency, sale_unit, pack_text, pack_quantity, pack_unit, tax_status, effective_date, observed_at, source_name, source_url, raw_source",
    );
  if (observationsError) throw new Error(observationsError.message);

  const { data: referenceSnapshots, error: snapshotsError } = await supabase
    .from("reference_snapshots")
    .select("id, source_kind, status, retrieved_at");
  if (snapshotsError) throw new Error(snapshotsError.message);

  const { data: policies, error: policiesError } = await supabase
    .from("insurance_policies")
    .select(
      "id, document_id, sum_insured, room_rent_limit, icu_limit, copay_percent, deductible, waiting_periods, sub_limits, exclusions, consumables_covered, other_conditions, extraction_provenance",
    )
    .in("document_id", documentIds);
  if (policiesError) throw new Error(policiesError.message);

  const itemRows = (items ?? []) as ExtractedItemRow[];
  const referenceRows = (referenceItems ?? []) as ReferenceItemRow[];
  const policyRows = (policies ?? []) as InsurancePolicyRow[];
  const productRows = (medicineProducts ?? []) as MedicineProductRow[];
  const aliasRows = (medicineAliases ?? []) as MedicineAliasCandidate[];
  const observationRows = (medicineObservations ?? []).map((observation) => ({
    ...observation,
    amount: Number(observation.amount),
    pack_quantity: observation.pack_quantity == null ? null : Number(observation.pack_quantity),
  })) as MedicinePriceObservation[];
  const snapshotRows = (referenceSnapshots ?? []) as ReferenceSnapshotRow[];
  const currentObservationRows = selectCurrentMedicineObservations(observationRows, snapshotRows);

  const resolutions = new Map(
    itemRows
      .filter((item) => item.item_type === "medicine")
      .map((item) => [
        item.id,
        resolveMedicineIdentity(
          item.medicine_identity as Parameters<typeof resolveMedicineIdentity>[0],
          item.name,
          item.normalized_name,
          productRows,
          aliasRows,
        ),
      ]),
  );

  for (const item of itemRows) {
    if (item.item_type !== "medicine") continue;
    const resolution = resolutions.get(item.id);
    if (!resolution) continue;
    const { error: resolutionError } = await supabase
      .from("extracted_items")
      .update({
        medicine_product_id: resolution.product_id,
        medicine_match_status: resolution.status,
        medicine_match_confidence: resolution.confidence,
        medicine_match_reason: resolution.reason,
      })
      .eq("id", item.id);
    if (resolutionError) throw new Error(resolutionError.message);
  }

  const resolvedItemRows = itemRows.map((item) => {
    const resolution = resolutions.get(item.id);
    return resolution
      ? {
          ...item,
          medicine_product_id: resolution.product_id,
          medicine_match_status: resolution.status,
          medicine_match_confidence: resolution.confidence,
          medicine_match_reason: resolution.reason,
        }
      : item;
  });

  const legacyMedicineReferences = referenceRows.filter((reference) => reference.category === "medicine" && !reference.medicine_product_id);

  const findings = [
    ...checkPrices(itemRows, referenceRows),
    ...checkMedicinePriceObservations(itemRows, resolutions, currentObservationRows),
    ...checkMedicineSavings(resolvedItemRows, legacyMedicineReferences),
    ...checkDuplicates(itemRows),
    ...checkQuantities(itemRows),
    ...checkPackageOverlap(itemRows),
    ...checkUnexplained(itemRows),
    ...checkInsuranceCoverage(policyRows),
  ];

  await supabase.from("audit_findings").delete().eq("case_id", caseId);

  if (findings.length > 0) {
    const { error: insertError } = await supabase.from("audit_findings").insert(
      findings.map((f) => ({
        case_id: caseId,
        document_id: f.document_id,
        finding_type: f.finding_type,
        title: f.title,
        description: f.description,
        evidence: f.evidence,
        confidence: f.confidence,
        related_item_id: f.related_item_id,
      })),
    );
    if (insertError) throw new Error(insertError.message);
  }

  return { findingsCount: findings.length };
}
