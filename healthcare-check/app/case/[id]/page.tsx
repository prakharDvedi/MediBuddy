import { createClient } from "@/lib/supabase/server";
import { UploadDocument } from "@/components/upload-document";
import { DocumentCard } from "@/components/document-card";
import { CaseSummary } from "@/components/case-summary";
import { CoverageSummary } from "@/components/coverage-summary";
import { FindingCard } from "@/components/finding-card";
import { ReviewWorkspaceHeader } from "@/components/run-audit-button";
import { EditableCaseTitle } from "@/components/editable-case-title";
import { AskPolicy } from "@/components/ask-policy";
import { CompareEstimate, type OtherPolicyTerm } from "@/components/compare-estimate";
import { QuestionsChecklist, type ChecklistItem } from "@/components/questions-checklist";
import { AppShell, BackLink } from "@/components/app-shell";
import { EmptyState, SectionHeader, StatusBadge } from "@/components/ui";
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
  const hasHospitalDocument = (documents ?? []).some((document) =>
    ["bill", "estimate", "quotation", "prescription"].includes(document.doc_type ?? ""),
  );
  const findingById = new Map((findings ?? []).map((finding) => [finding.id, finding]));
  const questionMap = new Map<string, ChecklistItem>();
  for (const question of questions ?? []) {
    const finding = question.finding_id ? findingById.get(question.finding_id) : null;
    const audience = finding?.finding_type === "coverage_gap" || (!finding && !hasHospitalDocument) ? "insurer" : "hospital";
    questionMap.set(question.id, {
      id: question.id,
      question: question.question_text,
      context: finding?.title ?? "General review",
      audience,
    });
  }
  const questionChecklist = Array.from(questionMap.values());

  const otherPolicyTerms: OtherPolicyTerm[] = [];
  const comparisonPolicy = policies[0];
  if (comparisonPolicy?.room_rent_limit != null) {
    otherPolicyTerms.push({
      label: "Room-rent restriction",
      description: `The policy limits room rent to ₹${comparisonPolicy.room_rent_limit.toLocaleString("en-IN")} per day. The comparison estimate shows this term separately and does not apply a proportional room-choice deduction.`,
    });
  }
  if (comparisonPolicy?.consumables_covered === false) {
    otherPolicyTerms.push({
      label: "Consumables exclusion",
      description: "Consumables are not covered under this policy. The comparison estimate shows this term separately and does not subtract the exclusion from the numeric result.",
    });
  }

  const statusTone = caseRow.status === "error" ? "danger" : caseRow.status === "ready" ? "success" : "info";

  return (
    <AppShell context="Case review">
      <main className="page-shell">
        <BackLink />
        <section className="mt-7 flex flex-col gap-4 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-info">Case review</p><EditableCaseTitle caseId={id} title={caseRow.title} /><p className="mt-2 text-sm text-text-muted">Your documents, findings, evidence, and next questions in one place.</p></div>
          <StatusBadge tone={statusTone}>{caseRow.status === "ready" ? "Ready to review" : caseRow.status === "error" ? "Needs attention" : "In progress"}</StatusBadge>
        </section>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="min-w-0">
            <section aria-labelledby="documents-heading">
              <SectionHeader headingId="documents-heading" eyebrow="Documents" title="Add or review your documents" description="Upload a bill, estimate, policy, or supporting page. MediBud keeps the source close to the result." />
              <div className="mt-5 grid gap-3"><UploadDocument caseId={id} />{documents && documents.length > 0 && documents.map((document) => <DocumentCard key={document.id} doc={document} />)}</div>
            </section>

            {items && items.length > 0 && <section className="mt-12" aria-labelledby="summary-heading"><SectionHeader headingId="summary-heading" eyebrow="At a glance" title="What the documents show" /><div className="mt-5"><CaseSummary totalBilled={totalBilled} findingsCount={(findings ?? []).length} highCount={highCount} mediumOrLowCount={mediumOrLowCount} potentialSavings={potentialSavings} /></div></section>}

            {policies.length > 0 && <section className="mt-12" aria-labelledby="insurance-heading"><SectionHeader headingId="insurance-heading" eyebrow="Insurance" title="What your policy says" description="Important limits and conditions are shown with the language of your policy in mind." /><div className="mt-5 grid gap-4">{policies.map((policy) => <CoverageSummary key={policy.id} policy={policy} />)}<AskPolicy caseId={id} />{(items ?? []).length > 0 && <CompareEstimate caseId={id} otherPolicyTerms={otherPolicyTerms} />}</div></section>}

            <section className="mt-12" aria-labelledby="findings-heading">
              <ReviewWorkspaceHeader caseId={id} />
              <div className="mt-8">
                <SectionHeader
                  eyebrow="Findings"
                  headingId="findings-heading"
                  title="Findings"
                  action={<p className="text-sm font-medium text-info sm:whitespace-nowrap">{(findings ?? []).length} finding{(findings ?? []).length === 1 ? "" : "s"} · {(questions ?? []).length} question{(questions ?? []).length === 1 ? "" : "s"}</p>}
                />
              </div>
              <div className="mt-5 grid gap-3">{!findings || findings.length === 0 ? <EmptyState title="No findings yet" description="Upload a hospital document, then review charges to prepare the evidence-backed findings." /> : sortedFindings.map((finding) => <FindingCard key={finding.id} finding={finding} questions={questionsByFinding.get(finding.id)} />)}</div>
            </section>
          </div>

          <aside className="h-fit lg:sticky lg:top-24">
            {questionChecklist.length > 0 ? <QuestionsChecklist items={questionChecklist} /> : <div className="rounded-[1rem] border border-border bg-surface p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">Review guide</p><ol className="mt-4 grid gap-3 text-sm text-text-muted"><li><span className="font-semibold text-text-primary">1.</span> Add the document that matters most.</li><li><span className="font-semibold text-text-primary">2.</span> Start with the summary and amounts.</li><li><span className="font-semibold text-text-primary">3.</span> Open evidence for anything unclear.</li><li><span className="font-semibold text-text-primary">4.</span> Take the suggested question with you.</li></ol></div>}
          </aside>
        </div>
      </main>
    </AppShell>
  );
}
