import { cn } from "@/components/ui";

export type StepState = "pending" | "active" | "done" | "error";
export type Step = { label: string; state: StepState };

export function ProcessingSteps({ steps }: { steps: Step[] }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-2 sm:gap-0">
      {steps.map((step, i) => (
        <li key={step.label} className="relative flex items-center gap-3 sm:block sm:pr-4">
          {i < steps.length - 1 && <span className="absolute left-3 top-7 hidden h-px w-[calc(100%-1.25rem)] bg-border sm:block" />}
          <span className={cn("relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold", step.state === "done" && "border-success bg-success text-white", step.state === "active" && "border-info bg-info-bg text-info", step.state === "error" && "border-danger bg-danger text-white", step.state === "pending" && "border-border-strong bg-surface text-text-muted")} aria-hidden>
            {step.state === "done" ? "✓" : step.state === "error" ? "!" : i + 1}
          </span>
          <span className={cn("text-sm sm:mt-2 sm:block", step.state === "pending" ? "text-text-muted" : step.state === "error" ? "font-medium text-danger" : step.state === "active" ? "font-medium text-info" : "text-success")}>{step.label}</span>
        </li>
      ))}
    </ol>
  );
}
