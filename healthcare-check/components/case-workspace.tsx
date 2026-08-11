"use client";

import { AskPolicy } from "@/components/ask-policy";
import { BackLink } from "@/components/app-shell";
import { CaseSummary } from "@/components/case-summary";
import { CompareEstimate, type OtherPolicyTerm } from "@/components/compare-estimate";
import { CoverageSummary } from "@/components/coverage-summary";
import { DocumentCard } from "@/components/document-card";
import { EditableCaseTitle } from "@/components/editable-case-title";
import { FindingCard } from "@/components/finding-card";
import { QuestionsChecklist, type ChecklistItem } from "@/components/questions-checklist";
import { ReviewWorkspaceHeader } from "@/components/run-audit-button";
import { SectionHeader, EmptyState, StatusBadge } from "@/components/ui";
import { UploadDocument } from "@/components/upload-document";
import { useLocale } from "@/components/locale-provider";
import { APP_COPY } from "@/lib/i18n/app-copy";
import type { Tone } from "@/lib/presentation";

type Document = { id: string; doc_type: string | null; original_filename: string; mime_type: string | null; page_count: number | null; status: string; created_at?: string };
type Finding = { id: string; finding_type: string; title: string; description: string; confidence: string; evidence: Record<string, unknown> | null; created_at?: string };
type Question = { id: string; question_text: string };
type Policy = { id: string; document_id: string; sum_insured: number | null; room_rent_limit: number | null; icu_limit: number | null; copay_percent: number | null; deductible: number | null; waiting_periods: { condition: string; duration: string }[] | null; sub_limits: { category: string; limit_amount: number | null; limit_percent: number | null }[] | null; exclusions: string[] | null; consumables_covered: boolean | null; other_conditions: string[] | null };

export function CaseWorkspace({ caseId, title, documents, findings, hasItems, totalBilled, highCount, mediumOrLowCount, potentialSavings, policies, questionChecklist, questionsByFinding, otherPolicyTerms, status, statusTone }: { caseId: string; title: string; documents: Document[]; findings: Finding[]; hasItems: boolean; totalBilled: number; highCount: number; mediumOrLowCount: number; potentialSavings: number; policies: Policy[]; questionChecklist: ChecklistItem[]; questionsByFinding: Record<string, Question[]>; otherPolicyTerms: OtherPolicyTerm[]; status: string; statusTone: Tone }) {
  const { locale } = useLocale();
  const copy = APP_COPY[locale];
  const caseCopy = copy.caseReview;
  const statusLabel = status === "ready" ? caseCopy.status.ready : status === "error" ? caseCopy.status.attention : caseCopy.status.progress;
  const questionCount = Object.values(questionsByFinding).reduce((total, questions) => total + questions.length, 0);

  const findingWord = findings.length === 1 ? caseCopy.finding : caseCopy.findingPlural ?? `${caseCopy.finding}s`;
  const questionWord = questionCount === 1 ? caseCopy.questions : caseCopy.questionPlural ?? `${caseCopy.questions}s`;
  return <main className="page-shell"><BackLink /><section className="mt-7 flex flex-col gap-4 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-info">{caseCopy.caseReview}</p><EditableCaseTitle caseId={caseId} title={title} /><p className="mt-2 text-sm text-text-muted">{caseCopy.documentsDescription}</p></div><StatusBadge tone={statusTone}>{statusLabel}</StatusBadge></section><div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem]"><div className="min-w-0"><section aria-labelledby="documents-heading"><SectionHeader headingId="documents-heading" eyebrow={caseCopy.documents} title={caseCopy.addReviewDocuments} description={caseCopy.documentsDescription} /><div className="mt-5 grid gap-3"><UploadDocument caseId={caseId} />{documents.length > 0 && documents.map((document) => <DocumentCard key={document.id} doc={document} />)}</div></section>{hasItems && <section className="mt-12" aria-labelledby="summary-heading"><SectionHeader headingId="summary-heading" eyebrow={caseCopy.atAGlance} title={caseCopy.documentsShow} /><div className="mt-5"><CaseSummary totalBilled={totalBilled} findingsCount={findings.length} highCount={highCount} mediumOrLowCount={mediumOrLowCount} potentialSavings={potentialSavings} /></div></section>}{policies.length > 0 && <section className="mt-12" aria-labelledby="insurance-heading"><SectionHeader headingId="insurance-heading" eyebrow={caseCopy.insurance} title={caseCopy.policySays} description={caseCopy.policyDescription} /><div className="mt-5 grid gap-4">{policies.map((policy) => <CoverageSummary key={policy.id} policy={policy} />)}<AskPolicy caseId={caseId} />{hasItems && <CompareEstimate caseId={caseId} otherPolicyTerms={otherPolicyTerms} />}</div></section>}<section className="mt-12" aria-labelledby="findings-heading"><ReviewWorkspaceHeader caseId={caseId} /><div className="mt-8"><SectionHeader eyebrow={caseCopy.findings} headingId="findings-heading" title={caseCopy.findings} action={<p className="text-sm font-medium text-info sm:whitespace-nowrap">{findings.length} {findingWord} · {questionCount} {questionWord}</p>} /></div><div className="mt-5 grid gap-3">{findings.length === 0 ? <EmptyState title={caseCopy.noFindings} description={caseCopy.noFindingsDescription} /> : findings.map((finding) => <FindingCard key={finding.id} finding={finding} questions={questionsByFinding[finding.id]} />)}</div></section></div><aside className="h-fit lg:sticky lg:top-24">{questionChecklist.length > 0 ? <QuestionsChecklist items={questionChecklist} /> : <div className="rounded-[1rem] border border-border bg-surface p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">{caseCopy.reviewGuide}</p><ol className="mt-4 grid gap-3 text-sm text-text-muted">{caseCopy.guide.map((item, index) => <li key={item}><span className="font-semibold text-text-primary">{index + 1}.</span> {item}</li>)}</ol></div>}</aside></div></main>;
}
