import Link from "next/link";
import {
  CASE_INTENT_CONFIG,
  getCaseIntentHref,
  type CaseIntent,
} from "@/lib/cases/intents";
import { TONE_CLASSES } from "@/lib/presentation";

export function DashboardActionCard({ intent }: { intent: CaseIntent }) {
  const config = CASE_INTENT_CONFIG[intent];

  return (
    <Link
      href={getCaseIntentHref(intent)}
      className={`focus-ring group flex h-full flex-col rounded-[1rem] border p-5 transition-transform hover:-translate-y-0.5 ${TONE_CLASSES[config.tone]}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">{config.eyebrow}</p>
          <h2 className="mt-2 text-lg font-semibold leading-snug text-text-primary">{config.title}</h2>
        </div>
        <span className="text-xl text-text-muted transition-transform group-hover:translate-x-1">→</span>
      </div>
      <p className="mt-4 text-sm leading-6 text-text-muted">{config.cardDescription}</p>
      <span className="mt-auto pt-6 text-sm font-medium text-primary">Start here</span>
    </Link>
  );
}
