import { MedicinePriceEvidence } from "./medicine-price-evidence";
import { FindingSurface, SourceBadge, StatusBadge } from "@/components/ui";
import { confidenceLabel, confidenceTone, findingTone } from "@/lib/presentation";
import { formatMoney } from "@/lib/dashboard/format";

type Finding = {
  id: string;
  finding_type: string;
  title: string;
  description: string;
  confidence: string;
  evidence: Record<string, unknown> | null;
};

type Question = { id: string; question_text: string };

const TYPE_LABELS: Record<string, string> = {
  price: "Price worth checking",
  quantity: "Quantity worth checking",
  duplicate: "Possible duplicate",
  package_overlap: "Package overlap",
  unexplained: "Charge to clarify",
  medicine_savings: "Medicine price",
  unit_unverified: "Unit needs confirmation",
  coverage_gap: "Policy limitation",
};

function Citation({ page, quote, meta }: { page?: number | null; quote?: string | null; meta?: string | null }) {
  if (!quote) return null;
  return (
    <div className="flex gap-3 rounded-xl border border-info/20 bg-info-bg px-3 py-3">
      {page != null && <span className="h-fit shrink-0 rounded-md bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-info">p.{page}</span>}
      <div className="min-w-0">
        <p className="line-clamp-3 text-xs italic leading-5 text-text-primary">“{quote}”</p>
        {meta && <p className="mt-1 text-[11px] text-info">{meta}</p>}
      </div>
    </div>
  );
}

function Evidence({ evidence }: { evidence: Record<string, unknown> | null }) {
  if (!evidence) return null;

  if (Array.isArray(evidence.price_observations)) {
    const page = typeof evidence.page === "number" ? evidence.page : null;
    const quote = typeof evidence.original_text === "string" ? evidence.original_text : null;
    return <div className="mt-4"><MedicinePriceEvidence evidence={evidence} /><div className="mt-3"><Citation page={page} quote={quote} /></div></div>;
  }

  const hospitalPrice = evidence.hospital_price;
  const referencePrice = evidence.reference_price;
  const hasPriceComparison = typeof hospitalPrice === "number" && typeof referencePrice === "number";
  const source = typeof evidence.source === "string" ? evidence.source : null;
  const referenceUnit = typeof evidence.reference_unit === "string" ? evidence.reference_unit : null;
  const potentialSavings = typeof evidence.potential_savings === "number" ? evidence.potential_savings : null;
  const occurrences = Array.isArray(evidence.occurrences) ? evidence.occurrences as { page?: number | null; original_text?: string | null; total_price?: number | null }[] : null;

  if (occurrences) {
    return <div className="mt-4 grid gap-2">{occurrences.map((occurrence, i) => <Citation key={i} page={occurrence.page} quote={occurrence.original_text} meta={occurrence.total_price != null ? formatMoney(occurrence.total_price) : null} />)}</div>;
  }

  const page = typeof evidence.page === "number" ? evidence.page : null;
  const quote = typeof evidence.original_text === "string" ? evidence.original_text : null;
  if (!hasPriceComparison && !quote) return null;

  return (
    <div className="mt-4 grid gap-3">
      {hasPriceComparison && (
        <div className="grid gap-2 rounded-xl border border-warning/20 bg-warning-bg p-4 sm:grid-cols-3">
          <div><p className="text-xs text-warning/75">Hospital charge</p><p className="mt-1 font-semibold text-text-primary">{formatMoney(hospitalPrice as number)}</p></div>
          <div><p className="text-xs text-warning/75">{source?.startsWith("NPPA ceiling price") ? "NPPA reference" : "Available reference"}</p><p className="mt-1 font-semibold text-text-primary">{formatMoney(referencePrice as number)}{referenceUnit ? ` / ${referenceUnit}` : ""}</p></div>
          {potentialSavings != null && <div><p className="text-xs text-warning/75">Potential difference</p><p className="mt-1 font-semibold text-warning">{formatMoney(potentialSavings)}</p></div>}
        </div>
      )}
      <Citation page={page} quote={quote} meta={source} />
    </div>
  );
}

export function FindingCard({ finding, questions }: { finding: Finding; questions: Question[] | undefined }) {
  const tone = findingTone(finding.finding_type, finding.confidence);
  const hasPotentialSavings = typeof finding.evidence?.potential_savings === "number";
  const label = finding.finding_type === "medicine_savings" && !hasPotentialSavings
    ? "Potential price difference"
    : TYPE_LABELS[finding.finding_type] ?? finding.finding_type;

  return (
    <FindingSurface tone={tone}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-text-muted">{label}</p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-text-primary">{finding.title}</h3>
        </div>
        <StatusBadge tone={confidenceTone(finding.confidence)}>{confidenceLabel(finding.confidence)}</StatusBadge>
      </div>

      <p className="mt-3 max-w-3xl text-sm leading-6 text-text-muted">{finding.description}</p>
      <Evidence evidence={finding.evidence} />

      {questions && questions.length > 0 && (
        <div className="mt-5 border-t border-border pt-4">
          <div className="flex items-center gap-2"><SourceBadge>{finding.finding_type === "coverage_gap" ? "Ask the insurer" : "Ask the hospital"}</SourceBadge></div>
          <ul className="mt-3 grid gap-2">
            {questions.map((question) => <li key={question.id} className="rounded-xl bg-surface/75 px-4 py-3 text-sm leading-6 text-text-primary">{question.question_text}</li>)}
          </ul>
        </div>
      )}
    </FindingSurface>
  );
}
