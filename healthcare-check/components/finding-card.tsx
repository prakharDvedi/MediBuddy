"use client";

import { MedicinePriceEvidence } from "./medicine-price-evidence";
import { FindingSurface, SourceBadge, StatusBadge } from "@/components/ui";
import { useLocale } from "@/components/locale-provider";
import { FINDING_COPY, fillFindingTemplate, isFindingType } from "@/lib/i18n/finding-copy";
import { confidenceTone, findingTone } from "@/lib/presentation";
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

function Evidence({ evidence, labels }: { evidence: Record<string, unknown> | null; labels: typeof FINDING_COPY.en.evidence }) {
  if (!evidence) return null;

  if (Array.isArray(evidence.price_observations)) {
    const page = typeof evidence.page === "number" ? evidence.page : null;
    const quote = typeof evidence.original_text === "string" ? evidence.original_text : null;
    return <div className="mt-4"><MedicinePriceEvidence evidence={evidence} labels={labels.medicine} /><div className="mt-3"><Citation page={page} quote={quote} /></div></div>;
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
          <div><p className="text-xs text-warning/75">{labels.hospitalCharge}</p><p className="mt-1 font-semibold text-text-primary">{formatMoney(hospitalPrice as number)}</p></div>
          <div><p className="text-xs text-warning/75">{source?.startsWith("NPPA ceiling price") ? labels.nppaReference : labels.availableReference}</p><p className="mt-1 font-semibold text-text-primary">{formatMoney(referencePrice as number)}{referenceUnit ? ` / ${referenceUnit}` : ""}</p></div>
          {potentialSavings != null && <div><p className="text-xs text-warning/75">{labels.potentialDifference}</p><p className="mt-1 font-semibold text-warning">{formatMoney(potentialSavings)}</p></div>}
        </div>
      )}
      <Citation page={page} quote={quote} meta={source} />
    </div>
  );
}

function localizedDescription(finding: Finding, locale: keyof typeof FINDING_COPY): string {
  if (!isFindingType(finding.finding_type)) return finding.description;

  const copy = FINDING_COPY[locale];
  const evidence = finding.evidence ?? {};
  const pages = Array.isArray(evidence.occurrences)
    ? (evidence.occurrences as { page?: number | null }[]).map((occurrence) => occurrence.page).filter((page): page is number => page != null)
    : [];
  const values: Record<string, string | number | undefined> = {
    item: typeof evidence.item === "string" ? evidence.item : undefined,
    packageItem: typeof evidence.package_item === "string" ? evidence.package_item : undefined,
    componentItem: typeof evidence.component_item === "string" ? evidence.component_item : undefined,
    hospitalPrice: typeof evidence.hospital_price === "number" ? formatMoney(evidence.hospital_price) : undefined,
    referencePrice: typeof evidence.reference_price === "number" ? formatMoney(evidence.reference_price) : undefined,
    potentialDifference: typeof evidence.potential_savings === "number"
      ? formatMoney(evidence.potential_savings)
      : typeof evidence.potential_price_difference === "number"
        ? formatMoney(evidence.potential_price_difference)
        : undefined,
    quantity: typeof evidence.quantity === "number" ? evidence.quantity : undefined,
    count: pages.length > 0 ? pages.length : Array.isArray(evidence.occurrences) ? evidence.occurrences.length : undefined,
    pages: pages.length > 0 ? ` (pages: ${pages.join(", ")})` : "",
    source: typeof evidence.source === "string"
      ? evidence.source
      : Array.isArray(evidence.price_observations) && typeof evidence.price_observations[0]?.label === "string"
        ? evidence.price_observations[0].label
        : undefined,
  };

  const template = copy.explanations[finding.finding_type];
  const requiredKeys = [...template.matchAll(/\{(\w+)\}/g)].map((match) => match[1]);
  if (requiredKeys.some((key) => values[key] === undefined)) return finding.description;
  return fillFindingTemplate(template, values);
}

function localizedTitle(finding: Finding, locale: keyof typeof FINDING_COPY): string {
  if (!isFindingType(finding.finding_type)) return finding.title;

  const copy = FINDING_COPY[locale];
  const evidence = finding.evidence ?? {};
  if (finding.finding_type !== "coverage_gap") {
    const item = typeof evidence.item === "string"
      ? evidence.item
      : typeof evidence.component_item === "string"
        ? evidence.component_item
        : undefined;
    return item ? `${copy.typeLabels[finding.finding_type]}: ${item}` : finding.title;
  }

  const coverageTitle = "room_rent_limit" in evidence
    ? copy.coverageTitles.roomRentLimit
    : "icu_limit" in evidence
      ? copy.coverageTitles.icuLimit
      : "copay_percent" in evidence
        ? copy.coverageTitles.copay
        : "deductible" in evidence
          ? copy.coverageTitles.deductible
          : "consumables_covered" in evidence
            ? copy.coverageTitles.consumables
            : Array.isArray(evidence.sub_limits)
              ? copy.coverageTitles.subLimits
              : Array.isArray(evidence.waiting_periods)
                ? copy.coverageTitles.waitingPeriods
                : null;
  if (!coverageTitle) return finding.title;

  const values: Record<string, string | number | undefined> = {
    amount: typeof evidence.room_rent_limit === "number"
      ? formatMoney(evidence.room_rent_limit)
      : typeof evidence.icu_limit === "number"
        ? formatMoney(evidence.icu_limit)
        : typeof evidence.copay_percent === "number"
          ? evidence.copay_percent
          : typeof evidence.deductible === "number"
            ? formatMoney(evidence.deductible)
            : undefined,
    count: Array.isArray(evidence.sub_limits) ? evidence.sub_limits.length : Array.isArray(evidence.waiting_periods) ? evidence.waiting_periods.length : undefined,
  };
  const requiredKeys = [...coverageTitle.matchAll(/\{(\w+)\}/g)].map((match) => match[1]);
  if (requiredKeys.some((key) => values[key] === undefined)) return finding.title;
  return fillFindingTemplate(coverageTitle, values);
}

export function FindingCard({ finding, questions }: { finding: Finding; questions: Question[] | undefined }) {
  const { locale } = useLocale();
  const copy = FINDING_COPY[locale];
  const tone = findingTone(finding.finding_type, finding.confidence);
  const typeLabel = isFindingType(finding.finding_type) ? copy.typeLabels[finding.finding_type] : finding.finding_type;
  const question = isFindingType(finding.finding_type) ? copy.questions[finding.finding_type] : questions?.[0]?.question_text;
  const severity = finding.confidence === "high" || finding.confidence === "medium" || finding.confidence === "low"
    ? copy.severityLabels[finding.confidence]
    : finding.confidence;

  return (
    <FindingSurface tone={tone}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-text-muted">{typeLabel}</p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-text-primary">{localizedTitle(finding, locale)}</h3>
        </div>
        <StatusBadge tone={confidenceTone(finding.confidence)}>{severity}</StatusBadge>
      </div>

      <p className="mt-3 max-w-3xl text-sm leading-6 text-text-muted">{localizedDescription(finding, locale)}</p>
      <Evidence evidence={finding.evidence} labels={copy.evidence} />

      {question && (
        <div className="mt-5 border-t border-border pt-4">
          <div className="flex items-center gap-2"><SourceBadge>{finding.finding_type === "coverage_gap" ? copy.audienceLabels.insurer : copy.audienceLabels.hospital}</SourceBadge></div>
          <ul className="mt-3 grid gap-2">
            <li className="rounded-xl bg-surface/75 px-4 py-3 text-sm leading-6 text-text-primary">{question}</li>
          </ul>
        </div>
      )}
    </FindingSurface>
  );
}
