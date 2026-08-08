import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";
import { UploadDocument } from "@/components/upload-document";
import { DocumentPages } from "@/components/document-pages";
import { DocumentItems } from "@/components/document-items";
import { RunAuditButton } from "@/components/run-audit-button";
import { AskPolicy } from "@/components/ask-policy";
import { CompareEstimate } from "@/components/compare-estimate";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

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
      const evidence = f.evidence as { potential_savings?: number } | null;
      return sum + (evidence?.potential_savings ?? 0);
    }, 0);

  const generalQuestions = (questions ?? []).filter((q) => !q.finding_id);
  const questionsByFinding = new Map<string, typeof questions>();
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
      <main className="mx-auto max-w-3xl px-6 py-16">
        <Link href="/dashboard" className="text-sm text-zinc-500 underline">
          &larr; Back to cases
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-black dark:text-zinc-50">
          {caseRow.title}
        </h1>

        <div className="mt-6">
          <UploadDocument caseId={id} />
        </div>

        <div className="mt-8 flex flex-col gap-3">
          {!documents || documents.length === 0 ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              No documents uploaded yet.
            </p>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                className="rounded-lg border border-black/10 dark:border-white/10 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-black dark:text-zinc-50">
                      {doc.original_filename}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {doc.doc_type} &middot; {doc.mime_type} &middot;{" "}
                      {doc.page_count ?? 0} page(s)
                    </p>
                  </div>
                  <span className="rounded-full bg-black/5 dark:bg-white/10 px-2.5 py-1 text-xs text-zinc-700 dark:text-zinc-300">
                    {doc.status}
                  </span>
                </div>
                <DocumentPages documentId={doc.id} />
                <DocumentItems documentId={doc.id} />
              </div>
            ))
          )}
        </div>

        {items && items.length > 0 && (
          <div className="mt-10 rounded-lg border border-black/10 dark:border-white/10 p-4">
            <p className="text-3xl font-semibold text-black dark:text-zinc-50">
              &#8377;{totalBilled.toLocaleString("en-IN")}
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {(findings ?? []).length} thing{(findings ?? []).length === 1 ? "" : "s"} worth checking
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              &#128308; {highCount} high confidence &middot; &#128993; {mediumOrLowCount}{" "}
              need clarification
            </p>
            {potentialSavings > 0 && (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Potential savings: &#8377;{potentialSavings.toLocaleString("en-IN")}
              </p>
            )}
          </div>
        )}

        {policies.map((policy) => (
          <div
            key={policy.id}
            className="mt-10 rounded-lg border border-black/10 dark:border-white/10 p-4"
          >
            <p className="text-sm font-medium text-black dark:text-zinc-50">Coverage summary</p>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-zinc-500">Sum insured</dt>
              <dd className="text-zinc-800 dark:text-zinc-200">
                {policy.sum_insured != null
                  ? `₹${policy.sum_insured.toLocaleString("en-IN")}`
                  : "Not stated"}
              </dd>
              <dt className="text-zinc-500">Room rent limit</dt>
              <dd className="text-zinc-800 dark:text-zinc-200">
                {policy.room_rent_limit != null
                  ? `₹${policy.room_rent_limit.toLocaleString("en-IN")}/day`
                  : "No cap stated"}
              </dd>
              <dt className="text-zinc-500">ICU limit</dt>
              <dd className="text-zinc-800 dark:text-zinc-200">
                {policy.icu_limit != null
                  ? `₹${policy.icu_limit.toLocaleString("en-IN")}/day`
                  : "No cap stated"}
              </dd>
              <dt className="text-zinc-500">Co-payment</dt>
              <dd className="text-zinc-800 dark:text-zinc-200">
                {policy.copay_percent != null ? `${policy.copay_percent}%` : "None stated"}
              </dd>
              <dt className="text-zinc-500">Deductible</dt>
              <dd className="text-zinc-800 dark:text-zinc-200">
                {policy.deductible != null
                  ? `₹${policy.deductible.toLocaleString("en-IN")}`
                  : "None stated"}
              </dd>
              <dt className="text-zinc-500">Consumables</dt>
              <dd className="text-zinc-800 dark:text-zinc-200">
                {policy.consumables_covered == null
                  ? "Not stated"
                  : policy.consumables_covered
                    ? "Covered"
                    : "Not covered"}
              </dd>
            </dl>
            {policy.sub_limits && policy.sub_limits.length > 0 && (
              <div className="mt-3 border-t border-black/5 dark:border-white/10 pt-2">
                <p className="text-xs font-medium text-zinc-500">Category sub-limits</p>
                <ul className="mt-1 list-disc pl-4">
                  {policy.sub_limits.map((s, i) => (
                    <li key={i} className="text-sm text-zinc-700 dark:text-zinc-300">
                      {s.category}
                      {s.limit_amount != null
                        ? `: ₹${s.limit_amount.toLocaleString("en-IN")}`
                        : s.limit_percent != null
                          ? `: ${s.limit_percent}% of sum insured`
                          : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {policy.waiting_periods && policy.waiting_periods.length > 0 && (
              <div className="mt-3 border-t border-black/5 dark:border-white/10 pt-2">
                <p className="text-xs font-medium text-zinc-500">Waiting periods</p>
                <ul className="mt-1 list-disc pl-4">
                  {policy.waiting_periods.map((w, i) => (
                    <li key={i} className="text-sm text-zinc-700 dark:text-zinc-300">
                      {w.condition}: {w.duration}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {policy.exclusions && policy.exclusions.length > 0 && (
              <div className="mt-3 border-t border-black/5 dark:border-white/10 pt-2">
                <p className="text-xs font-medium text-zinc-500">Exclusions</p>
                <ul className="mt-1 list-disc pl-4">
                  {policy.exclusions.map((e, i) => (
                    <li key={i} className="text-sm text-zinc-700 dark:text-zinc-300">
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}

        {policies.length > 0 && (
          <div className="mt-4">
            <AskPolicy caseId={id} />
          </div>
        )}

        {policies.length > 0 && (items ?? []).length > 0 && (
          <div className="mt-4">
            <CompareEstimate caseId={id} />
          </div>
        )}

        <div className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
              Findings
            </h2>
            <RunAuditButton caseId={id} />
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {!findings || findings.length === 0 ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                No findings yet. Run the audit after uploading a hospital
                document.
              </p>
            ) : (
              findings.map((finding) => (
                <div
                  key={finding.id}
                  className="rounded-lg border border-black/10 dark:border-white/10 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-black dark:text-zinc-50">
                      {finding.title}
                    </p>
                    <div className="flex shrink-0 gap-2">
                      <span className="rounded-full bg-black/5 dark:bg-white/10 px-2.5 py-1 text-xs text-zinc-700 dark:text-zinc-300">
                        {finding.finding_type}
                      </span>
                      <span className="rounded-full bg-black/5 dark:bg-white/10 px-2.5 py-1 text-xs text-zinc-700 dark:text-zinc-300">
                        {finding.confidence} confidence
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {finding.description}
                  </p>
                  {questionsByFinding.get(finding.id) && (
                    <div className="mt-3 border-t border-black/5 dark:border-white/10 pt-2">
                      <p className="text-xs font-medium text-zinc-500">
                        {finding.finding_type === "coverage_gap"
                          ? "Ask the insurer:"
                          : "Ask the hospital:"}
                      </p>
                      <ul className="mt-1 list-disc pl-4">
                        {questionsByFinding.get(finding.id)!.map((q) => (
                          <li key={q.id} className="text-sm text-zinc-700 dark:text-zinc-300">
                            {q.question_text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {generalQuestions.length > 0 && (
            <div className="mt-4 rounded-lg border border-black/10 dark:border-white/10 p-4">
              <p className="text-sm font-medium text-black dark:text-zinc-50">
                Other questions to ask
              </p>
              <ul className="mt-1 list-disc pl-4">
                {generalQuestions.map((q) => (
                  <li key={q.id} className="text-sm text-zinc-700 dark:text-zinc-300">
                    {q.question_text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
