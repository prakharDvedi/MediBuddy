"use client";

import { DashboardActionCard } from "@/components/dashboard-action-card";
import { DemoCaseActions } from "@/components/demo-case-actions";
import { RecentCases } from "@/components/recent-cases";
import { useLocale } from "@/components/locale-provider";
import { APP_COPY } from "@/lib/i18n/app-copy";
import type { RecentCase } from "@/lib/dashboard/data";

export function DashboardContent({ cases }: { cases: RecentCase[] }) {
  const { locale } = useLocale();
  const copy = APP_COPY[locale].dashboard;

  return <main className="relative overflow-hidden"><div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-success-bg/70 blur-3xl" /><div className="page-shell relative"><section className="soft-grid rounded-[1.25rem] border border-border bg-surface/60 p-5 sm:p-7"><h1 className="max-w-2xl text-3xl font-semibold leading-tight tracking-[-0.03em] text-text-primary sm:text-4xl">{copy.headline}</h1><p className="mt-2 max-w-xl text-base leading-7 text-text-muted">{copy.description}</p></section><section aria-labelledby="start-check-heading" className="mt-8"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">{copy.startNewCheck}</p><h2 id="start-check-heading" className="mt-1 text-2xl font-semibold tracking-tight text-text-primary">{copy.chooseStartingPoint}</h2></div></div><div className="mt-4 grid gap-3 md:grid-cols-3"><DashboardActionCard intent="bill" /><DashboardActionCard intent="policy" /><DashboardActionCard intent="compare" /></div></section><DemoCaseActions /><RecentCases cases={cases} /></div></main>;
}
