import Link from "next/link";
import { formatMoney, formatRelativeTime } from "@/lib/dashboard/format";
import type { RecentCase } from "@/lib/dashboard/data";

export function RecentCaseCard({ recentCase }: { recentCase: RecentCase }) {
  return (
    <article className="rounded-lg border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[.03]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-black dark:text-zinc-50">
            {recentCase.title}
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            {recentCase.workflowLabel} · {formatRelativeTime(recentCase.updatedAt)}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 sm:shrink-0">
          <div className="min-w-0 text-sm sm:text-right">
            <p className="font-medium text-black dark:text-zinc-50">{recentCase.statusLabel}</p>
            {recentCase.potentialSavings > 0 && (
              <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                Potential savings: {formatMoney(recentCase.potentialSavings)}
              </p>
            )}
          </div>
          <Link
            href={`/case/${recentCase.id}`}
            className="rounded-full bg-black px-3.5 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {recentCase.actionLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}
