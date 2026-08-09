import type { RecentCase } from "@/lib/dashboard/data";
import { RecentCaseCard } from "@/components/recent-case-card";

export function RecentCases({ cases }: { cases: RecentCase[] }) {
  return (
    <section aria-labelledby="recent-cases-heading" className="mt-8">
      <h2 id="recent-cases-heading" className="text-2xl font-semibold text-black dark:text-zinc-50">
        Recent cases
      </h2>

      {cases.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-black/15 px-4 py-6 text-sm text-zinc-600 dark:border-white/15 dark:text-zinc-400">
          Your cases will appear here after you upload a document.
        </div>
      ) : (
        <div className="mt-3 grid gap-2">
          {cases.map((recentCase) => (
            <RecentCaseCard key={recentCase.id} recentCase={recentCase} />
          ))}
        </div>
      )}
    </section>
  );
}
