export function CaseSummary({
  totalBilled,
  findingsCount,
  highCount,
  mediumOrLowCount,
  potentialSavings,
}: {
  totalBilled: number;
  findingsCount: number;
  highCount: number;
  mediumOrLowCount: number;
  potentialSavings: number;
}) {
  return (
    <div className="rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/[.02] p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Total billed</p>
      <p className="mt-1 text-4xl font-semibold text-black dark:text-zinc-50">
        ₹{totalBilled.toLocaleString("en-IN")}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
        <span>
          {findingsCount} thing{findingsCount === 1 ? "" : "s"} worth checking
        </span>
        {highCount > 0 && <span>{highCount} high confidence</span>}
        {mediumOrLowCount > 0 && <span>{mediumOrLowCount} need clarification</span>}
      </div>
      {potentialSavings > 0 && (
        <p className="mt-3 border-t border-black/5 dark:border-white/10 pt-3 text-sm">
          <span className="font-medium text-black dark:text-zinc-50">
            Potential savings: ₹{potentialSavings.toLocaleString("en-IN")}
          </span>
        </p>
      )}
    </div>
  );
}
