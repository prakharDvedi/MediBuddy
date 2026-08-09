import Link from "next/link";
import { PublicHeader } from "@/components/app-shell";

const USE_CASES = [
  {
    number: "01",
    title: "Check a hospital bill",
    description: "See charges and medicine prices worth checking, with evidence you can take to the billing desk.",
    href: "/signup",
    tone: "bg-warning-bg",
  },
  {
    number: "02",
    title: "Understand your policy",
    description: "Find limits, exclusions, waiting periods, and answers grounded in your own policy.",
    href: "/signup",
    tone: "bg-info-bg",
  },
  {
    number: "03",
    title: "Estimate what insurance may pay",
    description: "See the likely patient share and why deductions may apply before you commit to care.",
    href: "/signup",
    tone: "bg-success-bg",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden bg-background text-text-primary">
      <PublicHeader />

      <main>
        <section className="content-width relative grid min-w-0 gap-12 py-16 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
          <div className="pointer-events-none absolute -right-40 -top-24 h-96 w-96 rounded-full bg-success-bg/80 blur-3xl" />
          <div className="pointer-events-none absolute right-24 top-36 h-64 w-64 rounded-full bg-info-bg/80 blur-3xl" />
          <div className="relative min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-info">A clearer way to question healthcare costs</p>
            <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-[1.04] tracking-[-0.04em] text-text-primary sm:text-6xl">
              Understand the bill. Know what to ask next.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-text-muted sm:text-lg">
              MediBud turns hospital bills and insurance policies into plain-language summaries, evidence-backed findings, and practical questions.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/signup" className="focus-ring inline-flex min-h-11 items-center rounded-xl bg-primary px-5 py-3 text-sm font-medium text-white hover:bg-primary-hover">
                Check a bill or policy
              </Link>
              <Link href="/login" className="focus-ring inline-flex min-h-11 items-center rounded-xl border border-border-strong bg-surface px-5 py-3 text-sm font-medium text-text-primary hover:bg-surface-elevated">
                Log in
              </Link>
            </div>
            <p className="mt-5 max-w-lg text-xs leading-5 text-text-muted">
              MediBud helps you ask better questions. It does not diagnose, judge clinical care, or decide that a hospital has acted unlawfully.
            </p>
          </div>

          <div className="relative min-w-0 lg:pl-4">
            <div className="absolute -inset-5 rounded-[2rem] bg-info-bg/50 blur-2xl" />
            <div className="relative rounded-[1.25rem] border border-border bg-surface-elevated p-4 shadow-[0_24px_70px_rgb(23_43_58_/_0.12)] sm:p-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">Example review</p>
                  <p className="mt-1 font-semibold text-text-primary">Surgery estimate</p>
                </div>
                <span className="rounded-full bg-warning-bg px-2.5 py-1 text-xs font-medium text-warning">Worth investigating</span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-soft-canvas p-4">
                  <p className="text-xs text-text-muted">Total estimate</p>
                  <p className="mt-2 text-2xl font-semibold tabular-nums text-text-primary">₹1,84,620</p>
                </div>
                <div className="rounded-xl bg-warning-bg p-4 text-warning">
                  <p className="text-xs opacity-75">Potential difference</p>
                  <p className="mt-2 text-2xl font-semibold tabular-nums">₹416.12</p>
                </div>
              </div>
              <div className="mt-3 rounded-xl border border-info/20 bg-info-bg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-info">Medicine price</p>
                    <p className="mt-1 font-medium text-text-primary">Ceftriaxone 1 g injection</p>
                  </div>
                  <span className="text-xs font-medium text-info">Page 3</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-text-muted">Hospital charge</p><p className="mt-1 font-semibold text-text-primary">₹480 / vial</p></div>
                  <div><p className="text-text-muted">NPPA reference</p><p className="mt-1 font-semibold text-text-primary">₹63.88 / vial</p></div>
                </div>
              </div>
              <p className="mt-4 text-xs leading-5 text-text-muted">A reference price is evidence to discuss, not a guarantee that money is recoverable.</p>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-soft-canvas/70">
          <div className="content-width py-12 sm:py-16">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Start with a question</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">The right review depends on what you need to know.</h2>
            </div>
            <div className="mt-7 grid gap-3 lg:grid-cols-3">
              {USE_CASES.map((item) => (
                <Link key={item.number} href={item.href} className={`focus-ring group rounded-[1rem] border border-border ${item.tone} p-5 transition-transform hover:-translate-y-0.5`}>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-xs font-semibold tracking-[0.12em] text-text-muted">{item.number}</span>
                    <span className="text-lg text-text-muted transition-transform group-hover:translate-x-1">→</span>
                  </div>
                  <h3 className="mt-8 text-lg font-semibold text-text-primary">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-text-muted">{item.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="content-width flex flex-col gap-6 py-10 text-xs leading-5 text-text-muted sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-2xl">MediBud keeps your original documents separate from extracted information and shows where important numbers came from.</p>
          <p className="max-w-sm sm:text-right">Reference prices are not hospital billing caps or guaranteed recoverable amounts. Always confirm with your hospital, pharmacist, or insurer.</p>
        </section>
      </main>
    </div>
  );
}
