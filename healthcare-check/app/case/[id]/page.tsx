import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { CaseWorkspace } from "@/components/case-workspace";
import { type OtherPolicyTerm } from "@/components/compare-estimate";
import { calculatePotentialSavings } from "@/lib/audit/summary";
import { redirect, notFound } from "next/navigation";

type InsurancePolicySummary = {
  id: string;
  document_id: string;
  sum_insured: number | null;
  room_rent_limit: number | null;
  icu_limit: number | null;
  copay_percent: number | null;
  deductible: number | null;
  waiting_periods: { condition: string; duration: string }[] | null;
  sub_limits: { category: string; limit_amount: number | null; limit_percent: number | null }[] | null;
  exclusions: string[] | null;
  consumables_covered: boolean | null;
  other_conditions: string[] | null;
};

const CONFIDENCE_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) redirect("/login");

  const { data: caseRow } = await supabase.from("cases").select("id, title, status, created_at").eq("id", id).single();
  if (!caseRow) notFound();
  const { data: documents } = await supabase.from("documents").select("id, doc_type, original_filename, mime_type, page_count, status, created_at").eq("case_id", id).is("deleted_at", null).order("created_at", { ascending: false });
  const { data: findings } = await supabase.from("audit_findings").select("id, finding_type, title, description, confidence, evidence, created_at").eq("case_id", id).order("created_at", { ascending: false });
  const sortedFindings = [...(findings ?? [])].sort((a, b) => (CONFIDENCE_RANK[a.confidence] ?? 3) - (CONFIDENCE_RANK[b.confidence] ?? 3));
  const { data: questions } = await supabase.from("questions").select("id, finding_id, question_text").eq("case_id", id).order("created_at", { ascending: true });
  const documentIds = (documents ?? []).map((document) => document.id);
  const { data: items } = documentIds.length ? await supabase.from("extracted_items").select("total_price").in("document_id", documentIds) : { data: [] as { total_price: number | null }[] };
  const { data: rawPolicies } = documentIds.length ? await supabase.from("insurance_policies").select("id, document_id, sum_insured, room_rent_limit, icu_limit, copay_percent, deductible, waiting_periods, sub_limits, exclusions, consumables_covered, other_conditions").in("document_id", documentIds) : { data: [] };
  const policies = (rawPolicies ?? []) as InsurancePolicySummary[];
  const totalBilled = (items ?? []).reduce((sum, item) => sum + (item.total_price ?? 0), 0);
  const highCount = (findings ?? []).filter((finding) => finding.confidence === "high").length;
  const mediumOrLowCount = (findings ?? []).filter((finding) => finding.confidence !== "high").length;
  const potentialSavings = calculatePotentialSavings(findings ?? []);
  const questionsByFinding = new Map<string, NonNullable<typeof questions>>();
  for (const question of questions ?? []) {
    if (!question.finding_id) continue;
    const list = questionsByFinding.get(question.finding_id) ?? [];
    list.push(question);
    questionsByFinding.set(question.finding_id, list);
  }
  const hasHospitalDocument = (documents ?? []).some((document) => ["bill", "estimate", "quotation", "prescription"].includes(document.doc_type ?? ""));
  const findingById = new Map((findings ?? []).map((finding) => [finding.id, finding]));
  const questionMap = new Map<string, { id: string; question: string; context: string; audience: "hospital" | "insurer"; findingType?: string }>();
  for (const question of questions ?? []) {
    const finding = question.finding_id ? findingById.get(question.finding_id) : null;
    const audience = finding?.finding_type === "coverage_gap" || (!finding && !hasHospitalDocument) ? "insurer" : "hospital";
    questionMap.set(question.id, { id: question.id, question: question.question_text, context: finding?.title ?? "General review", audience, findingType: finding?.finding_type });
  }
  const otherPolicyTerms: OtherPolicyTerm[] = [];
  const comparisonPolicy = policies[0];
  if (comparisonPolicy?.room_rent_limit != null) otherPolicyTerms.push({ kind: "room_rent_restriction", amount: comparisonPolicy.room_rent_limit });
  if (comparisonPolicy?.consumables_covered === false) otherPolicyTerms.push({ kind: "consumables_exclusion" });
  const statusTone = caseRow.status === "error" ? "danger" : caseRow.status === "ready" ? "success" : "info";

  return <AppShell context="caseReview"><CaseWorkspace caseId={id} title={caseRow.title} documents={documents ?? []} findings={sortedFindings} hasItems={(items ?? []).length > 0} totalBilled={totalBilled} highCount={highCount} mediumOrLowCount={mediumOrLowCount} potentialSavings={potentialSavings} policies={policies} questionChecklist={Array.from(questionMap.values())} questionsByFinding={Object.fromEntries(Array.from(questionsByFinding.entries()))} otherPolicyTerms={otherPolicyTerms} status={caseRow.status} statusTone={statusTone} /></AppShell>;
}
