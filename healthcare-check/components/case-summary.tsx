"use client";

import { ImpactCard, MoneyValue, StatusBadge, Surface } from "@/components/ui";
import { useLocale } from "@/components/locale-provider";
import { APP_COPY, fillAppTemplate } from "@/lib/i18n/app-copy";

export function CaseSummary({ totalBilled, findingsCount, highCount, mediumOrLowCount, potentialSavings }: { totalBilled: number; findingsCount: number; highCount: number; mediumOrLowCount: number; potentialSavings: number }) {
  const { locale } = useLocale();
  const copy = APP_COPY[locale].summary;
  return <div className="grid gap-3 lg:grid-cols-[1fr_1.15fr]"><ImpactCard tone="neutral" label={copy.totalBill} className="bg-surface"><MoneyValue value={totalBilled} size="lg" className="mt-2 block text-text-primary" /><div className="mt-4 flex flex-wrap gap-2"><StatusBadge tone={findingsCount > 0 ? "warning" : "success"}>{findingsCount > 0 ? fillAppTemplate(copy.thingsWorthChecking, { count: findingsCount }) : copy.nothingFlagged}</StatusBadge>{highCount > 0 && <StatusBadge tone="success">{fillAppTemplate(copy.verified, { count: highCount })}</StatusBadge>}{mediumOrLowCount > 0 && <StatusBadge tone="warning">{fillAppTemplate(copy.needClarification, { count: mediumOrLowCount })}</StatusBadge>}</div></ImpactCard>{potentialSavings > 0 ? <ImpactCard tone="warning" label={copy.potentialSavings} description={copy.estimateDisclaimer}><MoneyValue value={potentialSavings} size="lg" className="mt-2 block text-warning" /></ImpactCard> : <Surface tone="info" className="flex flex-col justify-center"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-info">{copy.whatNext}</p><p className="mt-2 text-lg font-semibold text-text-primary">{copy.reviewEach}</p><p className="mt-1 text-sm leading-6 text-text-muted">{copy.evidenceClose}</p></Surface>}</div>;
}
