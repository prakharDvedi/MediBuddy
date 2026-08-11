import type { createClient } from "@/lib/supabase/server";
import type { Tone } from "@/lib/presentation";
import { calculatePotentialSavings } from "@/lib/audit/summary";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type CaseRow = {
  id: string;
  title: string;
  status: string;
  created_at: string;
};

type DocumentRow = {
  case_id: string;
  doc_type: string | null;
  status: string;
  created_at: string;
};

type FindingRow = {
  case_id: string;
  finding_type: string | null;
  evidence: unknown;
};

export type RecentCase = {
  id: string;
  title: string;
  workflowKey: WorkflowKey;
  updatedAt: string;
  statusLabel: string;
  statusKey: "attention" | "processing" | "findings" | "ready";
  statusCount: number;
  statusTone: Tone;
  potentialSavings: number;
  actionLabel: "Continue" | "View";
  actionKey: "continue" | "view";
};

export type WorkflowKey =
  | "billAndPolicy"
  | "insurancePolicy"
  | "hospitalBill"
  | "hospitalEstimate"
  | "procedureQuote"
  | "prescription"
  | "insuranceApproval"
  | "healthcareDocument"
  | "noDocument";

export async function getRecentCases(
  supabase: SupabaseServerClient,
): Promise<RecentCase[]> {
  const { data: cases, error: casesError } = await supabase
    .from("cases")
    .select("id, title, status, created_at")
    .order("created_at", { ascending: false })
    .limit(8);

  if (casesError) throw new Error(casesError.message);

  const caseRows = (cases ?? []) as CaseRow[];
  if (caseRows.length === 0) return [];

  const caseIds = caseRows.map((item) => item.id);
  const [documentsResult, findingsResult] = await Promise.all([
    supabase
      .from("documents")
      .select("case_id, doc_type, status, created_at")
      .in("case_id", caseIds)
      .is("deleted_at", null),
    supabase
      .from("audit_findings")
      .select("case_id, finding_type, evidence")
      .in("case_id", caseIds),
  ]);

  if (documentsResult.error) throw new Error(documentsResult.error.message);
  if (findingsResult.error) throw new Error(findingsResult.error.message);

  const documents = (documentsResult.data ?? []) as DocumentRow[];
  const findings = (findingsResult.data ?? []) as FindingRow[];
  const documentsByCase = groupBy(documents, (item) => item.case_id);
  const findingsByCase = groupBy(findings, (item) => item.case_id);

  return caseRows.map((caseRow) => {
    const caseDocuments = documentsByCase.get(caseRow.id) ?? [];
    const caseFindings = findingsByCase.get(caseRow.id) ?? [];
    const findingsCount = caseFindings.length;
    const potentialSavings = calculatePotentialSavings(caseFindings);
    const latestDocument = [...caseDocuments].sort(compareDates)[0];
    const hasProcessingDocument = caseDocuments.some(
      (document) => document.status === "uploaded" || document.status === "processing" || document.status === "extracted",
    );
    const hasErrorDocument = caseDocuments.some((document) => document.status === "error");

    return {
      id: caseRow.id,
      title: caseRow.title,
      updatedAt: latestDocument?.created_at ?? caseRow.created_at,
      workflowKey: getWorkflowKey(caseDocuments),
      statusLabel: hasErrorDocument
        ? "Needs attention"
        : hasProcessingDocument
          ? "Processing"
          : findingsCount > 0
            ? `${findingsCount} thing${findingsCount === 1 ? "" : "s"} worth checking`
            : "Ready to review",
      statusKey: hasErrorDocument ? "attention" : hasProcessingDocument ? "processing" : findingsCount > 0 ? "findings" : "ready",
      statusCount: findingsCount,
      statusTone: hasErrorDocument ? "danger" : hasProcessingDocument ? "info" : findingsCount > 0 ? "warning" : "success",
      potentialSavings: Number(potentialSavings.toFixed(2)),
      actionLabel: hasProcessingDocument ? "Continue" : "View",
      actionKey: hasProcessingDocument ? "continue" : "view",
    };
  });
}

function groupBy<T>(items: T[], keyOf: (item: T) => string) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }
  return groups;
}

function compareDates(a: { created_at: string }, b: { created_at: string }) {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

function getWorkflowKey(documents: DocumentRow[]): WorkflowKey {
  const types = new Set(documents.map((document) => document.doc_type));
  const hasPolicy = types.has("policy");
  const hasHospitalDocument = ["bill", "estimate", "quotation"].some((type) => types.has(type));

  if (hasPolicy && hasHospitalDocument) return "billAndPolicy";
  if (hasPolicy) return "insurancePolicy";
  if (types.has("bill")) return "hospitalBill";
  if (types.has("estimate")) return "hospitalEstimate";
  if (types.has("quotation")) return "procedureQuote";
  if (types.has("prescription")) return "prescription";
  if (types.has("approval")) return "insuranceApproval";
  return documents.length > 0 ? "healthcareDocument" : "noDocument";
}
