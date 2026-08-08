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
      "id, document_id, item_type, name, normalized_name, quantity, unit_price, total_price, source_page, raw_text, confidence",
    )
    .in("document_id", documentIds);
  if (itemsError) throw new Error(itemsError.message);

  const { data: referenceItems, error: referenceError } = await supabase
    .from("reference_items")
    .select("id, category, name, normalized_name, reference_price, unit, source_name, source_url");
  if (referenceError) throw new Error(referenceError.message);

  const { data: policies, error: policiesError } = await supabase
    .from("insurance_policies")
    .select(
      "id, document_id, sum_insured, room_rent_limit, icu_limit, copay_percent, deductible, waiting_periods, sub_limits, exclusions, consumables_covered, other_conditions",
    )
    .in("document_id", documentIds);
  if (policiesError) throw new Error(policiesError.message);

  const itemRows = (items ?? []) as ExtractedItemRow[];
  const referenceRows = (referenceItems ?? []) as ReferenceItemRow[];
  const policyRows = (policies ?? []) as InsurancePolicyRow[];

  const findings = [
    ...checkPrices(itemRows, referenceRows),
    ...checkMedicineSavings(itemRows, referenceRows),
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
