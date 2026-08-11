"use client";

import type { RecentCase } from "@/lib/dashboard/data";
import { RecentCaseCard } from "@/components/recent-case-card";
import { EmptyState } from "@/components/ui";
import { useLocale } from "@/components/locale-provider";
import { APP_COPY } from "@/lib/i18n/app-copy";

export function RecentCases({ cases }: { cases: RecentCase[] }) {
  const { locale } = useLocale();
  const copy = APP_COPY[locale].dashboard;
  return (
    <section aria-labelledby="recent-cases-heading" className="mt-14">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">{copy.yourWork}</p>
          <h2 id="recent-cases-heading" className="mt-1 text-2xl font-semibold tracking-tight text-text-primary">{copy.recentChecks}</h2>
        </div>
        {cases.length > 0 && <span className="text-sm text-text-muted">{cases.length} {copy.saved}</span>}
      </div>

      <div className="mt-4">
        {cases.length === 0 ? (
          <EmptyState title={copy.noChecks} description={copy.noChecksDescription} />
        ) : (
          <div className="grid gap-2">
            {cases.map((recentCase) => <RecentCaseCard key={recentCase.id} recentCase={recentCase} />)}
          </div>
        )}
      </div>
    </section>
  );
}
