import Link from "next/link";
import { formatMoney, formatRelativeTime } from "@/lib/dashboard/format";
import type { RecentCase } from "@/lib/dashboard/data";
import { StatusBadge } from "@/components/ui";

export function RecentCaseCard({ recentCase }: { recentCase: RecentCase }) {
  const statusTone = recentCase.statusLabel.toLowerCase().includes("attention")
    ? "danger"
    : recentCase.statusLabel.toLowerCase().includes("ready")
      ? "success"
      : recentCase.statusLabel.toLowerCase().includes("worth")
        ? "warning"
        : "info";

  return (
    <article className="surface group p-4 transition-colors hover:border-border-strong">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-text-primary">{recentCase.title}</h3>
          <p className="mt-1 text-sm text-text-muted">{recentCase.workflowLabel} · {formatRelativeTime(recentCase.updatedAt)}</p>
        </div>

        <div className="flex items-center justify-between gap-4 sm:shrink-0">
          <div className="min-w-0 sm:text-right">
            <StatusBadge tone={statusTone}>{recentCase.statusLabel}</StatusBadge>
            {recentCase.potentialSavings > 0 && <p className="mt-1 text-xs text-warning">Potential difference: {formatMoney(recentCase.potentialSavings)}</p>}
          </div>
          <Link href={`/case/${recentCase.id}`} className="focus-ring rounded-xl bg-primary px-3.5 py-2 text-sm font-medium text-white hover:bg-primary-hover">
            {recentCase.actionLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}
