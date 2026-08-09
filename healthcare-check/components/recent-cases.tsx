import type { RecentCase } from "@/lib/dashboard/data";
import { RecentCaseCard } from "@/components/recent-case-card";
import { EmptyState } from "@/components/ui";

export function RecentCases({ cases }: { cases: RecentCase[] }) {
  return (
    <section aria-labelledby="recent-cases-heading" className="mt-14">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">Your work</p>
          <h2 id="recent-cases-heading" className="mt-1 text-2xl font-semibold tracking-tight text-text-primary">Recent checks</h2>
        </div>
        {cases.length > 0 && <span className="text-sm text-text-muted">{cases.length} saved</span>}
      </div>

      <div className="mt-4">
        {cases.length === 0 ? (
          <EmptyState title="No checks yet" description="Start by uploading a hospital bill or insurance policy. Your work will appear here." />
        ) : (
          <div className="grid gap-2">
            {cases.map((recentCase) => <RecentCaseCard key={recentCase.id} recentCase={recentCase} />)}
          </div>
        )}
      </div>
    </section>
  );
}
