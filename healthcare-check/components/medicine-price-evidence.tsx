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

function money(value: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
}

function dateLabel(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function PriceSource({ source }: { source: MedicinePriceSource }) {
  if (typeof source.amount !== "number") return null;
  const isNppa = source.source_kind === "nppa";
  const context = isNppa
    ? `${source.sale_unit ?? "unit"}${source.tax_status === "excluded" ? ", excluding tax" : ""}`
    : `${source.pack_text ?? "pack"}${source.tax_status === "unknown" ? " · listed MRP" : ""}`;
  const effective = isNppa ? dateLabel(source.effective_date) : dateLabel(source.observed_at);

  return (
    <div className="rounded border border-black/10 dark:border-white/10 px-3 py-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{source.label}</span>
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {money(source.amount, source.currency)}
        </span>
      </div>
      <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">{context}</p>
      {effective && <p className="mt-0.5 text-[11px] text-zinc-500">{isNppa ? "Effective" : "Retrieved"}: {effective}</p>}
      {source.source && <p className="mt-0.5 text-[11px] text-zinc-500">{source.source}</p>}
      {source.source_url && (
        <a className="mt-1 inline-block text-[11px] text-zinc-600 underline dark:text-zinc-400" href={source.source_url} target="_blank" rel="noreferrer">
          View source
        </a>
      )}
      {source.unit_compatible === false && (
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Unit could not be verified for this bill line.</p>
      )}
    </div>
  );
}

export function MedicinePriceEvidence({ evidence }: { evidence: Record<string, unknown> }) {
  const sources = Array.isArray(evidence.price_observations)
    ? (evidence.price_observations as MedicinePriceSource[])
    : [];
  const matchReason = typeof evidence.match_reason === "string" ? evidence.match_reason : null;
  const identity = typeof evidence.medicine_identity === "string" ? evidence.medicine_identity : null;
  const potentialSavings = typeof evidence.potential_savings === "number" ? evidence.potential_savings : null;
  const potentialDifference = typeof evidence.potential_price_difference === "number" ? evidence.potential_price_difference : null;

  return (
    <div className="mt-3 flex flex-col gap-2">
      <div className="flex flex-col gap-0.5 text-sm">
        {typeof evidence.hospital_price === "number" && (
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            Hospital charge: {money(evidence.hospital_price as number)}{typeof evidence.hospital_unit === "string" ? ` / ${evidence.hospital_unit}` : ""}
          </span>
        )}
        {identity && <span className="text-zinc-600 dark:text-zinc-400">Matched medicine: {identity}</span>}
        {matchReason && <span className="text-xs text-zinc-500">{matchReason}</span>}
      </div>
      {sources.map((source, index) => <PriceSource key={`${source.source_kind ?? "source"}-${index}`} source={source} />)}
      {potentialDifference != null && (
        <p className="font-medium text-zinc-900 dark:text-zinc-100">
          {potentialSavings != null ? "Potential savings" : "Potential price difference"}: {money(potentialDifference)}
        </p>
      )}
      {potentialDifference != null && (
        <p className="text-[11px] leading-4 text-zinc-500">
          Estimated from the available reference price. This does not guarantee that this amount is recoverable or that the hospital charge is unlawful.
        </p>
      )}
    </div>
  );
}
