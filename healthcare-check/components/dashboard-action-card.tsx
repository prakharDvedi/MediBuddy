import Link from "next/link";
import {
  CASE_INTENT_CONFIG,
  getCaseIntentHref,
  type CaseIntent,
} from "@/lib/cases/intents";

export function DashboardActionCard({ intent }: { intent: CaseIntent }) {
  const config = CASE_INTENT_CONFIG[intent];

  return (
    <Link
      href={getCaseIntentHref(intent)}
      className={
        "group flex h-full flex-col rounded-xl border border-black/10 bg-white p-4 hover:border-black/30 " +
        "dark:border-white/10 dark:bg-white/[.03] dark:hover:border-white/30"
      }
    >
      <div>
        <h2 className="text-lg font-semibold leading-snug text-black dark:text-zinc-50">
          {config.title}
        </h2>
        <p className="mt-2 text-sm leading-5 text-zinc-600 dark:text-zinc-400">
          {config.cardDescription}
        </p>
      </div>
      <span className="mt-auto pt-5 text-sm font-medium text-black underline decoration-black/20 underline-offset-4 group-hover:decoration-black dark:text-white dark:decoration-white/30 dark:group-hover:decoration-white">
        Start here →
      </span>
    </Link>
  );
}
