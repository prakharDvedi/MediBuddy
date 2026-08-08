type Policy = {
  id: string;
  sum_insured: number | null;
  room_rent_limit: number | null;
  icu_limit: number | null;
  copay_percent: number | null;
  deductible: number | null;
  waiting_periods: { condition: string; duration: string }[] | null;
  sub_limits: { category: string; limit_amount: number | null; limit_percent: number | null }[] | null;
  exclusions: string[] | null;
  consumables_covered: boolean | null;
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5 text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right font-medium text-zinc-900 dark:text-zinc-100">{value}</span>
    </div>
  );
}

function ListBlock({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-3 border-t border-black/5 dark:border-white/10 pt-3">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <ul className="mt-1.5 flex flex-col gap-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-zinc-700 dark:text-zinc-300">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CoverageSummary({ policy }: { policy: Policy }) {
  const subLimits = (policy.sub_limits ?? []).map(
    (s) =>
      `${s.category}${
        s.limit_amount != null
          ? `: ₹${s.limit_amount.toLocaleString("en-IN")}`
          : s.limit_percent != null
            ? `: ${s.limit_percent}% of sum insured`
            : ""
      }`,
  );
  const waitingPeriods = (policy.waiting_periods ?? []).map((w) => `${w.condition}: ${w.duration}`);
  const exclusions = policy.exclusions ?? [];

  return (
    <div className="rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/[.02] p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Coverage summary</p>
      <div className="mt-2 divide-y divide-black/5 dark:divide-white/10">
        <Row
          label="Sum insured"
          value={policy.sum_insured != null ? `₹${policy.sum_insured.toLocaleString("en-IN")}` : "Not stated"}
        />
        <Row
          label="Room rent limit"
          value={policy.room_rent_limit != null ? `₹${policy.room_rent_limit.toLocaleString("en-IN")}/day` : "No cap stated"}
        />
        <Row
          label="ICU limit"
          value={policy.icu_limit != null ? `₹${policy.icu_limit.toLocaleString("en-IN")}/day` : "No cap stated"}
        />
        <Row label="Co-payment" value={policy.copay_percent != null ? `${policy.copay_percent}%` : "None stated"} />
        <Row
          label="Deductible"
          value={policy.deductible != null ? `₹${policy.deductible.toLocaleString("en-IN")}` : "None stated"}
        />
        <Row
          label="Consumables"
          value={
            policy.consumables_covered == null
              ? "Not stated"
              : policy.consumables_covered
                ? "Covered"
                : "Not covered"
          }
        />
      </div>
      <ListBlock label="Category sub-limits" items={subLimits} />
      <ListBlock label="Waiting periods" items={waitingPeriods} />
      <ListBlock label="Exclusions" items={exclusions} />
    </div>
  );
}
