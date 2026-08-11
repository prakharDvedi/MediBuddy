"use client";

import { cn, StatusBadge, Surface } from "@/components/ui";
import { useLocale } from "@/components/locale-provider";
import { formatMoney } from "@/lib/dashboard/format";
import { POLICY_UI_COPY } from "@/lib/documents/policy-language";
import { coverageTone, TONE_CLASSES, type Tone } from "@/lib/presentation";

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

function money(value: number | null) {
  return value == null ? null : formatMoney(value);
}

function CoverageState({
  value,
  trueLabel,
  falseLabel,
  notClearlyStated,
}: {
  value: boolean | null;
  trueLabel: string;
  falseLabel: string;
  notClearlyStated: string;
}) {
  return <StatusBadge tone={coverageTone(value)}>{value == null ? notClearlyStated : value ? trueLabel : falseLabel}</StatusBadge>;
}

function Limit({
  label,
  value,
  suffix,
  notClearlyStated,
  confirmWithInsurer,
  tone = "info",
}: {
  label: string;
  value: string | null;
  suffix?: string;
  notClearlyStated: string;
  confirmWithInsurer: string;
  tone?: Tone;
}) {
  return (
    <div className={cn("rounded-xl border p-4", TONE_CLASSES[tone])}>
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-2 text-lg font-semibold text-text-primary">{value ? `${value}${suffix ?? ""}` : notClearlyStated}</p>
      {!value && <p className="mt-1 text-xs text-warning">{confirmWithInsurer}</p>}
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
      <ul className={cn("mt-3 grid gap-2", listClassName)}>{items.map((item, index) => <li key={index} className={`rounded-xl px-3 py-2.5 text-sm leading-6 ${tone === "warning" ? "bg-danger-bg text-text-primary" : "bg-soft-canvas text-text-primary"}`}>{item}</li>)}</ul>
    </div>
  );
}

export function CoverageSummary({ policy }: { policy: Policy }) {
  const { locale } = useLocale();
  const copy = POLICY_UI_COPY[locale].coverage;
  const subLimits = (policy.sub_limits ?? []).map((s) => {
    const detail = s.limit_amount != null
      ? `: ${formatMoney(s.limit_amount)}`
      : s.limit_percent != null
        ? `: ${s.limit_percent}${copy.percentOfSumInsured}`
        : "";
    return `${s.category}${detail}`;
  });
  const waitingPeriods = (policy.waiting_periods ?? []).map((w) => `${w.condition}: ${w.duration}`);
  const exclusions = policy.exclusions ?? [];

  return (
    <Surface tone="info" className="p-5 sm:p-6" lang={locale}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-info">{copy.eyebrow}</p><h3 className="mt-1 text-xl font-semibold tracking-tight text-text-primary">{copy.title}</h3></div>
        <StatusBadge tone="info">{copy.fromPolicy}</StatusBadge>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Limit label={copy.sumInsured} value={money(policy.sum_insured)} notClearlyStated={copy.notClearlyStated} confirmWithInsurer={copy.confirmWithInsurer} />
        <Limit label={copy.roomRentLimit} value={money(policy.room_rent_limit)} suffix={copy.perDay} notClearlyStated={copy.notClearlyStated} confirmWithInsurer={copy.confirmWithInsurer} />
        <Limit label={copy.icuLimit} value={money(policy.icu_limit)} suffix={copy.perDay} notClearlyStated={copy.notClearlyStated} confirmWithInsurer={copy.confirmWithInsurer} />
        <Limit label={copy.coPayment} value={policy.copay_percent != null ? `${policy.copay_percent}%` : null} notClearlyStated={copy.notClearlyStated} confirmWithInsurer={copy.confirmWithInsurer} tone="warning" />
        <Limit label={copy.deductible} value={money(policy.deductible)} notClearlyStated={copy.notClearlyStated} confirmWithInsurer={copy.confirmWithInsurer} tone="warning" />
        <div className="rounded-xl border border-success/20 bg-success-bg p-4"><p className="text-xs text-text-muted">{copy.consumables}</p><div className="mt-2"><CoverageState value={policy.consumables_covered} trueLabel={copy.covered} falseLabel={copy.notCovered} notClearlyStated={copy.notClearlyStated} /></div></div>
      </div>
      <div className="mt-6 grid gap-6">
        <ListBlock label={copy.categorySubLimits} items={subLimits} listClassName="sm:grid-cols-3" />
        <ListBlock label={copy.waitingPeriods} items={waitingPeriods} listClassName="sm:grid-cols-2" />
        <ListBlock label={copy.importantExclusions} items={exclusions} tone="warning" listClassName="sm:grid-cols-2" />
      </div>
    </Surface>
  );
}
