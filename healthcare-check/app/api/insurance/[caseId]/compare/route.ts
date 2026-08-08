import { createClient } from "@/lib/supabase/server";
import { computeEstimateComparison } from "@/lib/insurance/compare";
import type { ExtractedItemRow, InsurancePolicyRow } from "@/lib/audit/types";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ caseId: string }> },
) {
  const { caseId } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: caseRow, error: caseError } = await supabase
    .from("cases")
    .select("id")
    .eq("id", caseId)
    .single();
  if (caseError || !caseRow) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  const { data: documents, error: docsError } = await supabase
    .from("documents")
    .select("id, doc_type")
    .eq("case_id", caseId)
    .is("deleted_at", null);
  if (docsError) {
    return NextResponse.json({ error: docsError.message }, { status: 500 });
  }

  const allDocIds = (documents ?? []).map((d) => d.id as string);
  const policyDocIds = (documents ?? [])
    .filter((d) => d.doc_type === "policy")
    .map((d) => d.id as string);

  if (policyDocIds.length === 0) {
    return NextResponse.json(
      { error: "No insurance policy uploaded for this case." },
      { status: 400 },
    );
  }
  if (allDocIds.length === 0) {
    return NextResponse.json({ error: "No documents uploaded for this case." }, { status: 400 });
  }

  try {
    const [{ data: items, error: itemsError }, { data: policies, error: policiesError }] =
      await Promise.all([
        supabase
          .from("extracted_items")
          .select(
            "id, document_id, item_type, name, normalized_name, quantity, unit_price, total_price, source_page, raw_text, confidence",
          )
          .in("document_id", allDocIds),
        supabase
          .from("insurance_policies")
          .select(
            "id, document_id, sum_insured, room_rent_limit, icu_limit, copay_percent, deductible, waiting_periods, sub_limits, exclusions, consumables_covered, other_conditions",
          )
          .in("document_id", policyDocIds)
          .order("created_at", { ascending: false })
          .limit(1),
      ]);
    if (itemsError) throw new Error(itemsError.message);
    if (policiesError) throw new Error(policiesError.message);

    const itemRows = (items ?? []) as ExtractedItemRow[];
    const policyRows = (policies ?? []) as InsurancePolicyRow[];

    if (itemRows.length === 0) {
      return NextResponse.json(
        { error: "No hospital estimate/bill line items to compare." },
        { status: 400 },
      );
    }
    if (policyRows.length === 0) {
      return NextResponse.json(
        { error: "Policy document hasn't finished processing yet." },
        { status: 400 },
      );
    }

    const result = computeEstimateComparison(itemRows, policyRows[0]);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Comparison failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
