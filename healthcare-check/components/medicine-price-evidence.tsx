import { SourceBadge, StatusBadge } from "@/components/ui";

type MedicinePriceSource = {
  source_kind?: "nppa" | "pmbi";
  label?: string;
  amount?: number;
  currency?: string;
  sale_unit?: string | null;
  pack_text?: string | null;
  pack_quantity?: number | null;
  pack_unit?: string | null;
  tax_status?: string;
  effective_date?: string | null;
  observed_at?: string | null;
  source?: string | null;
  source_url?: string | null;
  unit_compatible?: boolean;
  unit_reason?: string | null;
};

type MedicineEvidenceLabels = {
  hospitalCharge: string;
  effective: string;
  retrieved: string;
  viewSource: string;
  unitCouldNotBeVerified: string;
  potentialSavings: string;
  potentialPriceDifference: string;
  estimateDisclaimer: string;
};

function money(value: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
}

function dateLabel(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function PriceSource({ source, labels }: { source: MedicinePriceSource; labels: MedicineEvidenceLabels }) {
  if (typeof source.amount !== "number") return null;
  const isNppa = source.source_kind === "nppa";
  const context = isNppa ? `${source.sale_unit ?? "unit"}${source.tax_status === "excluded" ? ", excluding tax" : ""}` : `${source.pack_text ?? "pack"}${source.tax_status === "unknown" ? " · listed MRP" : ""}`;
  const effective = isNppa ? dateLabel(source.effective_date) : dateLabel(source.observed_at);

  return (
    <div className="rounded-xl border border-info/20 bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><SourceBadge>{source.label ?? (isNppa ? "NPPA ceiling price" : "Jan Aushadhi listed MRP")}</SourceBadge><p className="mt-2 text-sm text-text-muted">{context}</p></div>
        <p className="text-lg font-semibold tabular-nums text-text-primary">{money(source.amount, source.currency)}</p>
      </div>
      {effective && <p className="mt-2 text-xs text-text-muted">{isNppa ? labels.effective : labels.retrieved}: {effective}</p>}
      {source.source && <p className="mt-1 text-xs text-text-muted">{source.source}</p>}
      {source.source_url && <a className="focus-ring mt-2 inline-flex rounded text-xs font-medium text-info underline underline-offset-4" href={source.source_url} target="_blank" rel="noreferrer">{labels.viewSource}</a>}
      {source.unit_compatible === false && <div className="mt-3"><StatusBadge tone="warning">{labels.unitCouldNotBeVerified}</StatusBadge></div>}
    </div>
  );
}

export function MedicinePriceEvidence({ evidence, labels }: { evidence: Record<string, unknown>; labels: MedicineEvidenceLabels }) {
  const sources = Array.isArray(evidence.price_observations) ? evidence.price_observations as MedicinePriceSource[] : [];
  const matchReason = typeof evidence.match_reason === "string" ? evidence.match_reason : null;
  const identity = typeof evidence.medicine_identity === "string" ? evidence.medicine_identity : null;
  const potentialSavings = typeof evidence.potential_savings === "number" ? evidence.potential_savings : null;
  const potentialDifference = typeof evidence.potential_price_difference === "number" ? evidence.potential_price_difference : null;
  const hospitalPrice = typeof evidence.hospital_price === "number" ? evidence.hospital_price : null;
  const hospitalUnit = typeof evidence.hospital_unit === "string" ? evidence.hospital_unit : null;

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {identity && <p className="text-base font-semibold text-text-primary">{identity}</p>}
          {matchReason && <p className="mt-1 text-xs leading-5 text-text-muted">{matchReason}</p>}
        </div>
        {hospitalPrice != null && <div className="text-left sm:text-right"><p className="text-xs text-text-muted">{labels.hospitalCharge}</p><p className="mt-1 text-xl font-semibold tabular-nums text-text-primary">{money(hospitalPrice)}{hospitalUnit ? ` / ${hospitalUnit}` : ""}</p></div>}
      </div>
      {sources.length > 0 && <div className="grid gap-2 sm:grid-cols-2">{sources.map((source, index) => <PriceSource key={`${source.source_kind ?? "source"}-${index}`} source={source} labels={labels} />)}</div>}
      {potentialDifference != null && <div className="rounded-xl border border-warning/25 bg-warning-bg px-4 py-3"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-warning">{potentialSavings != null ? labels.potentialSavings : labels.potentialPriceDifference}</p><p className="mt-1 text-2xl font-semibold tabular-nums text-warning">{money(potentialDifference)}</p></div>}
      {potentialDifference != null && <p className="text-xs leading-5 text-text-muted">{labels.estimateDisclaimer}</p>}
    </div>
  );
}
