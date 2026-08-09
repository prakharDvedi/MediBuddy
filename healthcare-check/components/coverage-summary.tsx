import { coverageTone, TONE_CLASSES, type Tone } from "@/lib/presentation";
import { cn, StatusBadge, Surface } from "@/components/ui";
import { formatMoney } from "@/lib/dashboard/format";

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

function money(value: number | null) { return value == null ? null : formatMoney(value); }

function CoverageState({ value, trueLabel, falseLabel }: { value: boolean | null; trueLabel: string; falseLabel: string }) {
  return <StatusBadge tone={coverageTone(value)}>{value == null ? "Not clearly stated" : value ? trueLabel : falseLabel}</StatusBadge>;
}

function Limit({ label, value, suffix, tone = "info" }: { label: string; value: string | null; suffix?: string; tone?: Tone }) {
  return (
    <div className={cn("rounded-xl border p-4", TONE_CLASSES[tone])}>
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-2 text-lg font-semibold text-text-primary">{value ? `${value}${suffix ?? ""}` : "Not clearly stated"}</p>
      {!value && <p className="mt-1 text-xs text-warning">Confirm with your insurer.</p>}
    </div>
  );
}

function ListBlock({
  label,
  items,
  tone = "neutral",
  listClassName,
}: {
  label: string;
  items: string[];
  tone?: "neutral" | "warning";
  listClassName?: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className={`border-t pt-5 ${tone === "warning" ? "border-danger/20" : "border-border"}`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.1em] ${tone === "warning" ? "text-danger" : "text-text-muted"}`}>{label}</p>
      <ul className={cn("mt-3 grid gap-2", listClassName)}>{items.map((item, i) => <li key={i} className={`rounded-xl px-3 py-2.5 text-sm leading-6 ${tone === "warning" ? "bg-danger-bg text-text-primary" : "bg-soft-canvas text-text-primary"}`}>{item}</li>)}</ul>
    </div>
  );
}

export function CoverageSummary({ policy }: { policy: Policy }) {
  const subLimits = (policy.sub_limits ?? []).map((s) => {
    const detail = s.limit_amount != null
      ? `: ₹${s.limit_amount.toLocaleString("en-IN")}`
      : s.limit_percent != null
        ? `: ${s.limit_percent}% of sum insured`
        : "";
    return `${s.category}${detail}`;
  });
  const waitingPeriods = (policy.waiting_periods ?? []).map((w) => `${w.condition}: ${w.duration}`);
  const exclusions = policy.exclusions ?? [];

  return (
    <Surface tone="info" className="p-5 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-info">Policy facts</p><h3 className="mt-1 text-xl font-semibold tracking-tight text-text-primary">Coverage summary</h3></div>
        <StatusBadge tone="info">From your policy</StatusBadge>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Limit label="Sum insured" value={money(policy.sum_insured)} />
        <Limit label="Room-rent limit" value={money(policy.room_rent_limit)} suffix=" / day" />
        <Limit label="ICU limit" value={money(policy.icu_limit)} suffix=" / day" />
        <Limit label="Co-payment" value={policy.copay_percent != null ? `${policy.copay_percent}%` : null} tone="warning" />
        <Limit label="Deductible" value={money(policy.deductible)} tone="warning" />
        <div className="rounded-xl border border-success/20 bg-success-bg p-4"><p className="text-xs text-text-muted">Consumables</p><div className="mt-2"><CoverageState value={policy.consumables_covered} trueLabel="Covered" falseLabel="Not covered" /></div></div>
      </div>
      <div className="mt-6 grid gap-6">
        <ListBlock label="Category sub-limits" items={subLimits} listClassName="sm:grid-cols-3" />
        <ListBlock label="Waiting periods" items={waitingPeriods} listClassName="sm:grid-cols-2" />
        <ListBlock label="Important exclusions" items={exclusions} tone="warning" listClassName="sm:grid-cols-2" />
      </div>
    </Surface>
  );
}
