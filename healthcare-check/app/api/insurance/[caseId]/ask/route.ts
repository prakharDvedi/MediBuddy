import { createClient } from "@/lib/supabase/server";
import { searchPolicyChunks, computeDerivedPolicyFacts } from "@/lib/rag/policy";
import { answerPolicyQuestion } from "@/lib/documents/policy-qa";
import { rewritePolicyQuestion } from "@/lib/documents/policy-query";
import {
  normalizePolicyAnswerLanguage,
  POLICY_UI_COPY,
} from "@/lib/documents/policy-language";
import type { InsurancePolicyRow } from "@/lib/audit/types";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
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

  const body = await request.json();
  const question = typeof body.question === "string" ? body.question : "";
  const answerLanguage = normalizePolicyAnswerLanguage(body.answer_language);
  if (!question || typeof question !== "string" || !question.trim()) {
    return NextResponse.json({ error: "A question is required" }, { status: 400 });
  }

  const { data: policyDocs, error: docsError } = await supabase
    .from("documents")
    .select("id")
    .eq("case_id", caseId)
    .eq("doc_type", "policy")
    .is("deleted_at", null);
  if (docsError) {
    return NextResponse.json({ error: docsError.message }, { status: 500 });
  }
  const policyDocIds = (policyDocs ?? []).map((d) => d.id as string);
  if (policyDocIds.length === 0) {
    return NextResponse.json(
      { error: "No insurance policy uploaded for this case yet." },
      { status: 400 },
    );
  }

  try {
    const retrievalQuery = await rewritePolicyQuestion(question);
    const [chunks, { data: policies, error: policiesError }] = await Promise.all([
      searchPolicyChunks(supabase, policyDocIds, retrievalQuery, 6),
      supabase
        .from("insurance_policies")
        .select(
          "id, document_id, sum_insured, room_rent_limit, icu_limit, copay_percent, deductible, waiting_periods, sub_limits, exclusions, consumables_covered, other_conditions",
        )
        .in("document_id", policyDocIds),
    ]);
    if (policiesError) throw new Error(policiesError.message);

    const facts = ((policies ?? []) as InsurancePolicyRow[]).flatMap(computeDerivedPolicyFacts);

    if (chunks.length === 0 && facts.length === 0) {
      return NextResponse.json({
        answer: POLICY_UI_COPY[answerLanguage].noMatch,
        basis: "requires_confirmation",
        citations: [],
        confidence: "low",
        answerLanguage,
        retrievalQuery,
        chunksUsed: 0,
      });
    }

    const excerpts = chunks.map((c) => ({ page: c.page, section: c.sectionTitle, content: c.content }));
    const result = await answerPolicyQuestion(question, answerLanguage, excerpts, facts);

    return NextResponse.json({ ...result, answerLanguage, retrievalQuery, chunksUsed: chunks.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Policy Q&A failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
