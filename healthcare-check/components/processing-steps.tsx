export type StepState = "pending" | "active" | "done" | "error";

export type Step = { label: string; state: StepState };

/**
 * Fixed-stage loading indicator ("Uploading" / "Extracting" / ...) instead
 * of a single line of text that keeps replacing itself — lets the user see
 * the whole pipeline and exactly where it is in one glance.
 */
export function ProcessingSteps({ steps }: { steps: Step[] }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {steps.map((step, i) => (
        <li key={i} className="flex items-center gap-2.5 text-sm">
          <span
            className={
              "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] leading-none " +
              (step.state === "done"
                ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                : step.state === "active"
                  ? "border-zinc-400 dark:border-zinc-500 animate-pulse"
                  : step.state === "error"
                    ? "border-red-600 text-red-600"
                    : "border-black/15 dark:border-white/15")
            }
            aria-hidden
          >
            {step.state === "done" ? "✓" : step.state === "error" ? "!" : ""}
          </span>
          <span
            className={
              step.state === "pending"
                ? "text-zinc-400 dark:text-zinc-600"
                : step.state === "error"
                  ? "text-red-600"
                  : step.state === "active"
                    ? "font-medium text-zinc-900 dark:text-zinc-100"
                    : "text-zinc-600 dark:text-zinc-400"
            }
          >
            {step.label}
          </span>
        </li>
      ))}
    </ul>
  );
}
