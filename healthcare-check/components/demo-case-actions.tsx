"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErrorState } from "@/components/ui";

type DemoKind = "bill" | "insurance";

const DEMOS: { kind: DemoKind; title: string; description: string; endpoint: string }[] = [
  {
    kind: "bill",
    title: "Try a sample hospital bill",
    description: "See medicine references, a CGHS comparison, and duplicate-charge checks with cited source pages.",
    endpoint: "/api/demo-cases/bill",
  },
  {
    kind: "insurance",
    title: "Try a sample insurance case",
    description: "Explore policy retrieval, coverage findings, questions, and an estimate-versus-policy comparison.",
    endpoint: "/api/demo-cases/insurance",
  },
];

export function DemoCaseActions() {
  const router = useRouter();
  const [busy, setBusy] = useState<DemoKind | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createDemo(kind: DemoKind, endpoint: string) {
    setBusy(kind);
    setError(null);

    try {
      const response = await fetch(endpoint, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not create the demo case");
      router.push(`/case/${data.case.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the demo case");
      setBusy(null);
    }
  }

  return (
    <section aria-labelledby="demo-heading" className="mt-10 rounded-[1.25rem] border border-warning/25 bg-warning-bg/50 p-5 sm:p-6">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-warning">Guided demos</p>
        <h2 id="demo-heading" className="mt-1 text-2xl font-semibold tracking-tight text-text-primary">See MedBud in action</h2>
        <p className="mt-2 text-sm leading-6 text-text-muted">These are controlled synthetic documents, created privately for your account, to demonstrate all capabilities. They are not real medical or insurance records.</p>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {DEMOS.map((demo) => (
          <button
            key={demo.kind}
            type="button"
            onClick={() => void createDemo(demo.kind, demo.endpoint)}
            disabled={busy !== null}
            className="focus-ring group flex min-h-36 flex-col rounded-[1rem] border border-warning/25 bg-surface p-5 text-left transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
          >
            <span className="text-lg font-semibold text-text-primary">{busy === demo.kind ? "Preparing your demo..." : demo.title}</span>
            <span className="mt-3 text-sm leading-6 text-text-muted">{demo.description}</span>
            <span className="mt-auto pt-5 text-sm font-medium text-primary">{busy === demo.kind ? "Creating a fresh case" : "Create a fresh case →"}</span>
          </button>
        ))}
      </div>
      {error && <div className="mt-4"><ErrorState message={error} /></div>}
    </section>
  );
}
