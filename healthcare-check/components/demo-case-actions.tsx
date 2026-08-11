"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErrorState } from "@/components/ui";
import { useLocale } from "@/components/locale-provider";
import { APP_COPY } from "@/lib/i18n/app-copy";

type DemoKind = "bill" | "insurance";
const DEMOS: { kind: DemoKind; endpoint: string }[] = [{ kind: "bill", endpoint: "/api/demo-cases/bill" }, { kind: "insurance", endpoint: "/api/demo-cases/insurance" }];

export function DemoCaseActions() {
  const router = useRouter();
  const { locale } = useLocale();
  const copy = APP_COPY[locale].dashboard;
  const [busy, setBusy] = useState<DemoKind | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createDemo(kind: DemoKind, endpoint: string) {
    setBusy(kind);
    setError(null);
    try {
      const response = await fetch(endpoint, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? copy.demoError);
      router.push(`/case/${data.case.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.demoError);
      setBusy(null);
    }
  }

  return <section aria-labelledby="demo-heading" className="mt-10 rounded-[1.25rem] border border-warning/25 bg-warning-bg/50 p-5 sm:p-6"><div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-warning">{copy.guidedDemos}</p><h2 id="demo-heading" className="mt-1 text-2xl font-semibold tracking-tight text-text-primary">{copy.seeInAction}</h2><p className="mt-2 text-sm leading-6 text-text-muted">{copy.demoDisclaimer}</p></div><div className="mt-5 grid gap-3 md:grid-cols-2">{DEMOS.map((demo) => <button key={demo.kind} type="button" onClick={() => void createDemo(demo.kind, demo.endpoint)} disabled={busy !== null} className="focus-ring group flex min-h-36 flex-col rounded-[1rem] border border-warning/25 bg-surface p-5 text-left transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"><span className="text-lg font-semibold text-text-primary">{busy === demo.kind ? copy.preparingDemo : demo.kind === "bill" ? copy.tryBill : copy.tryPolicy}</span><span className="mt-3 text-sm leading-6 text-text-muted">{demo.kind === "bill" ? copy.tryBillDescription : copy.tryPolicyDescription}</span><span className="mt-auto pt-5 text-sm font-medium text-primary">{busy === demo.kind ? copy.creatingCase : copy.createCase}</span></button>)}</div>{error && <div className="mt-4"><ErrorState message={error} /></div>}</section>;
}
