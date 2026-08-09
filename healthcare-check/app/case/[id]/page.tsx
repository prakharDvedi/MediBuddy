import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";
import { UploadDocument } from "@/components/upload-document";
import { DocumentCard } from "@/components/document-card";
import { CaseSummary } from "@/components/case-summary";
import { CoverageSummary } from "@/components/coverage-summary";
import { FindingCard } from "@/components/finding-card";
import { RunAuditButton } from "@/components/run-audit-button";
import { EditableCaseTitle } from "@/components/editable-case-title";
import { AskPolicy } from "@/components/ask-policy";
import { CompareEstimate } from "@/components/compare-estimate";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";

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

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{children}</p>
  );
}

export default async function CasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();

  if (!auth?.claims) {
    redirect("/login");
  }

  const { data: caseRow } = await supabase
    .from("cases")
    .select("id, title, status, created_at")
    .eq("id", id)
    .single();

  if (!caseRow) {
    notFound();
  }

  const { data: documents } = await supabase
    .from("documents")
    .select("id, doc_type, original_filename, mime_type, page_count, status, created_at")
    .eq("case_id", id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const { data: findings } = await supabase
    .from("audit_findings")
    .select("id, finding_type, title, description, confidence, evidence, created_at")
    .eq("case_id", id)
    .order("created_at", { ascending: false });

  const sortedFindings = [...(findings ?? [])].sort(
    (a, b) => (CONFIDENCE_RANK[a.confidence] ?? 3) - (CONFIDENCE_RANK[b.confidence] ?? 3),
  );

  const { data: questions } = await supabase
    .from("questions")
    .select("id, finding_id, question_text")
    .eq("case_id", id)
    .order("created_at", { ascending: true });

  const documentIds = (documents ?? []).map((d) => d.id);
  const { data: items } = documentIds.length
    ? await supabase.from("extracted_items").select("total_price").in("document_id", documentIds)
    : { data: [] as { total_price: number | null }[] };

  const { data: rawPolicies } = documentIds.length
    ? await supabase
        .from("insurance_policies")
        .select(
          "id, document_id, sum_insured, room_rent_limit, icu_limit, copay_percent, deductible, waiting_periods, sub_limits, exclusions, consumables_covered, other_conditions",
        )
        .in("document_id", documentIds)
    : { data: [] };
  const policies = (rawPolicies ?? []) as InsurancePolicySummary[];

  const totalBilled = (items ?? []).reduce((sum, i) => sum + (i.total_price ?? 0), 0);
  const highCount = (findings ?? []).filter((f) => f.confidence === "high").length;
  const mediumOrLowCount = (findings ?? []).filter((f) => f.confidence !== "high").length;
  const potentialSavings = (findings ?? [])
    .filter((f) => f.finding_type === "medicine_savings")
    .reduce((sum, f) => {
      const evidence = f.evidence as { potential_savings?: unknown } | null;
      return sum + (typeof evidence?.potential_savings === "number" ? evidence.potential_savings : 0);
    }, 0);
  const generalQuestions = (questions ?? []).filter((q) => !q.finding_id);
  const questionsByFinding = new Map<string, NonNullable<typeof questions>>();
  for (const q of questions ?? []) {
    if (!q.finding_id) continue;
    const list = questionsByFinding.get(q.finding_id) ?? [];
    list.push(q);
    questionsByFinding.set(q.finding_id, list);
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <nav className="flex items-center justify-between border-b border-black/10 dark:border-white/10 px-6 py-4">
        <Link href="/dashboard" className="font-semibold text-black dark:text-zinc-50">
          Healthcare Check
        </Link>
        <LogoutButton />
      </nav>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <Link href="/dashboard" className="text-sm text-zinc-500 hover:underline">
          &larr; Back to cases
        </Link>
        <EditableCaseTitle caseId={id} title={caseRow.title} />

        <section className="mt-8 flex flex-col gap-3">
          <UploadDocument caseId={id} />
          {documents && documents.length > 0 && (
            <div className="flex flex-col gap-3">
              {documents.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))}
            </div>
          )}
        </section>

        {items && items.length > 0 && (
          <section className="mt-10 flex flex-col gap-3">
            <SectionLabel>Summary</SectionLabel>
            <CaseSummary
              totalBilled={totalBilled}
              findingsCount={(findings ?? []).length}
              highCount={highCount}
              mediumOrLowCount={mediumOrLowCount}
              potentialSavings={potentialSavings}
            />
          </section>
        )}

        {policies.length > 0 && (
          <section className="mt-10 flex flex-col gap-3">
            <SectionLabel>Insurance</SectionLabel>
            {policies.map((policy) => (
              <CoverageSummary key={policy.id} policy={policy} />
            ))}
            <AskPolicy caseId={id} />
            {(items ?? []).length > 0 && <CompareEstimate caseId={id} />}
          </section>
        )}

        <section className="mt-10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <SectionLabel>Findings</SectionLabel>
            <RunAuditButton caseId={id} />
          </div>

          {!findings || findings.length === 0 ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              No findings yet. Run the audit after uploading a hospital document.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {sortedFindings.map((finding) => (
                <FindingCard
                  key={finding.id}
                  finding={finding}
                  questions={questionsByFinding.get(finding.id)}
                />
              ))}
            </div>
          )}

          {generalQuestions.length > 0 && (
            <div className="rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/[.02] p-4">
              <p className="text-sm font-medium text-black dark:text-zinc-50">
                Other questions to ask
              </p>
              <ul className="mt-1 flex flex-col gap-1">
                {generalQuestions.map((q) => (
                  <li key={q.id} className="text-sm text-zinc-700 dark:text-zinc-300">
                    {q.question_text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
