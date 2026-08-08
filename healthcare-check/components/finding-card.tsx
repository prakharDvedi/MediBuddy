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
  price: "Price",
  quantity: "Quantity",
  duplicate: "Duplicate",
  package_overlap: "Package overlap",
  unexplained: "Unexplained charge",
  medicine_savings: "Potential savings",
  coverage_gap: "Coverage term",
};

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const isHigh = confidence === "high";
  return (
    <span
      className={
        "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium " +
        (isHigh
          ? "bg-black text-white dark:bg-white dark:text-black"
          : "border border-black/15 dark:border-white/15 text-zinc-600 dark:text-zinc-400")
      }
    >
      {confidence} confidence
    </span>
  );
}

function Citation({
  page,
  quote,
  meta,
}: {
  page?: number | null;
  quote?: string | null;
  meta?: string | null;
}) {
  if (!quote) return null;
  return (
    <div className="flex gap-2 rounded border border-black/10 dark:border-white/10 bg-black/[.02] dark:bg-white/[.03] px-2.5 py-2">
      {page != null && (
        <span className="h-fit shrink-0 rounded bg-black/5 dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
          p.{page}
        </span>
      )}
      <div className="min-w-0">
        <p className="line-clamp-2 text-xs italic text-zinc-600 dark:text-zinc-400">
          &ldquo;{quote}&rdquo;
        </p>
        {meta && <p className="mt-0.5 text-[10px] text-zinc-500">{meta}</p>}
      </div>
    </div>
  );
}

/**
 * Renders whatever citation-worthy shape a finding's evidence jsonb
 * happens to have, driven by which fields are present rather than a
 * per-finding_type switch — every check in lib/audit/*.ts that quotes the
 * source document uses the same {page, original_text} shape, so this stays
 * generic. Policy-derived (coverage_gap) findings have no document quote to
 * cite — they render nothing here, the description already states the
 * extracted number.
 */
function Evidence({ evidence }: { evidence: Record<string, unknown> | null }) {
  if (!evidence) return null;

  const hospitalPrice = evidence.hospital_price;
  const referencePrice = evidence.reference_price;
  const hasPriceComparison =
    typeof hospitalPrice === "number" && typeof referencePrice === "number";
  const source = typeof evidence.source === "string" ? evidence.source : null;

  const occurrences = Array.isArray(evidence.occurrences)
    ? (evidence.occurrences as {
        page?: number | null;
        original_text?: string | null;
        quantity?: number | null;
        total_price?: number | null;
      }[])
    : null;

  if (occurrences) {
    return (
      <div className="mt-3 flex flex-col gap-1.5">
        {occurrences.map((o, i) => (
          <Citation
            key={i}
            page={o.page}
            quote={o.original_text}
            meta={o.total_price != null ? `₹${o.total_price.toLocaleString("en-IN")}` : null}
          />
        ))}
      </div>
    );
  }

  const page = typeof evidence.page === "number" ? evidence.page : null;
  const quote = typeof evidence.original_text === "string" ? evidence.original_text : null;

  if (!hasPriceComparison && !quote) return null;

  return (
    <div className="mt-3 flex flex-col gap-2">
      {hasPriceComparison && (
        <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            Billed ₹{(hospitalPrice as number).toLocaleString("en-IN")}
          </span>
          <span className="text-zinc-400">vs.</span>
          <span className="text-zinc-600 dark:text-zinc-400">
            reference ₹{(referencePrice as number).toLocaleString("en-IN")}
            {source ? ` (${source})` : ""}
          </span>
        </div>
      )}
      <Citation page={page} quote={quote} />
    </div>
  );
}

export function FindingCard({
  finding,
  questions,
}: {
  finding: Finding;
  questions: Question[] | undefined;
}) {
  return (
    <div className="rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/[.02] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-zinc-500">
            {TYPE_LABELS[finding.finding_type] ?? finding.finding_type}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-black dark:text-zinc-50">
            {finding.title}
          </p>
        </div>
        <ConfidenceBadge confidence={finding.confidence} />
      </div>

      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{finding.description}</p>

      <Evidence evidence={finding.evidence} />

      {questions && questions.length > 0 && (
        <div className="mt-3 border-t border-black/5 dark:border-white/10 pt-2.5">
          <p className="text-xs font-medium text-zinc-500">
            {finding.finding_type === "coverage_gap" ? "Ask the insurer:" : "Ask the hospital:"}
          </p>
          <ul className="mt-1 flex flex-col gap-1">
            {questions.map((q) => (
              <li key={q.id} className="text-sm text-zinc-700 dark:text-zinc-300">
                {q.question_text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
