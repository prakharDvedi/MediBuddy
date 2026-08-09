import Link from "next/link";
import {
  CASE_INTENT_CONFIG,
  getCaseIntentHref,
  type CaseIntent,
} from "@/lib/cases/intents";

export function DashboardActionCard({ intent }: { intent: CaseIntent }) {
  const config = CASE_INTENT_CONFIG[intent];
  const tone = intent === "bill" ? "bg-warning-bg" : intent === "policy" ? "bg-info-bg" : "bg-success-bg";
  const eyebrow = intent === "bill" ? "Hospital costs" : intent === "policy" ? "Policy clarity" : "Planning ahead";

  return (
    <Link
      href={getCaseIntentHref(intent)}
      className={`focus-ring group flex h-full flex-col rounded-[1rem] border border-border ${tone} p-5 transition-transform hover:-translate-y-0.5`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">{eyebrow}</p>
          <h2 className="mt-2 text-lg font-semibold leading-snug text-text-primary">{config.title}</h2>
        </div>
        <span className="text-xl text-text-muted transition-transform group-hover:translate-x-1">→</span>
      </div>
      <p className="mt-4 text-sm leading-6 text-text-muted">{config.cardDescription}</p>
      <span className="mt-auto pt-6 text-sm font-medium text-primary">Start here</span>
    </Link>
  );
}
