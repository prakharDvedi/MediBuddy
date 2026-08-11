"use client";

import Link from "next/link";
import { PublicHeader } from "@/components/app-shell";
import { useLocale } from "@/components/locale-provider";
import { CASE_INTENT_CONFIG, type CaseIntent } from "@/lib/cases/intents";
import { APP_COPY } from "@/lib/i18n/app-copy";
import { TONE_CLASSES } from "@/lib/presentation";

const USE_CASES = [
  { number: "01", intent: "bill" },
  { number: "02", intent: "policy" },
  { number: "03", intent: "compare" },
] satisfies { number: string; intent: CaseIntent }[];

export default function Home() {
  const { locale } = useLocale();
  const copy = APP_COPY[locale].home;

  return (
    <div className="min-h-screen overflow-hidden bg-background text-text-primary">
      <PublicHeader />
      <main>
        <section className="content-width relative grid min-w-0 gap-12 py-16 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
          <div className="pointer-events-none absolute -right-40 -top-24 h-96 w-96 rounded-full bg-success-bg/80 blur-3xl" />
          <div className="pointer-events-none absolute right-24 top-36 h-64 w-64 rounded-full bg-info-bg/80 blur-3xl" />
          <div className="relative min-w-0">
            <h1 className="max-w-2xl text-4xl font-semibold leading-[1.04] tracking-[-0.04em] text-text-primary sm:text-[3.25rem]">{copy.headline}</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-text-muted sm:text-lg">{copy.description}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3"><Link href="/login" className="focus-ring inline-flex min-h-11 items-center rounded-xl bg-primary px-5 py-3 text-sm font-medium text-white hover:bg-primary-hover">{copy.primaryAction}</Link></div>
            <p className="mt-4 max-w-md text-xs leading-5 text-text-muted/75">{copy.disclaimer}</p>
          </div>

          <div className="relative min-w-0 lg:pl-4">
            <div className="absolute -inset-5 rounded-[2rem] bg-info-bg/50 blur-2xl" />
            <div className="relative rounded-[1.25rem] border border-border bg-surface-elevated p-4 shadow-[0_24px_70px_rgb(23_43_58_/_0.12)] sm:p-6">
              <div className="flex flex-col items-start gap-2 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">{copy.exampleReview}</p><p className="mt-1 font-semibold text-text-primary">{copy.exampleTitle}</p></div><span className="shrink-0 whitespace-nowrap rounded-full bg-warning-bg px-2.5 py-1 text-center text-xs font-medium text-warning">{copy.worthInvestigating}</span></div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-soft-canvas p-4"><p className="text-xs text-text-muted">{copy.totalEstimate}</p><p className="mt-2 text-2xl font-semibold tabular-nums text-text-primary">₹1,84,620</p></div><div className="rounded-xl bg-warning-bg p-4 text-warning"><p className="text-xs opacity-75">{copy.potentialDifference}</p><p className="mt-2 text-2xl font-semibold tabular-nums">₹416.12</p></div></div>
              <div className="mt-3 rounded-xl border border-info/20 bg-info-bg p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.1em] text-info">{copy.medicinePrice}</p><p className="mt-1 font-medium text-text-primary">Ceftriaxone 1 g injection</p></div><span className="text-xs font-medium text-info">{copy.page} 3</span></div><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><p className="text-text-muted">{copy.hospitalCharge}</p><p className="mt-1 font-semibold text-text-primary">₹480 / vial</p></div><div><p className="text-text-muted">{copy.nppaReference}</p><p className="mt-1 font-semibold text-text-primary">₹63.88 / vial</p></div></div></div>
              <p className="mt-4 text-xs leading-5 text-text-muted">{copy.referenceDisclaimer}</p>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-soft-canvas/70"><div className="content-width py-12 sm:py-16"><div className="max-w-xl"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">{copy.startWithQuestion}</p><h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{copy.reviewDepends}</h2></div><div className="mt-7 grid gap-3 lg:grid-cols-3">{USE_CASES.map((item) => { const config = CASE_INTENT_CONFIG[item.intent]; const intentCopy = copy.intents[item.intent]; return <Link key={item.number} href="/signup" className={`focus-ring group rounded-[1rem] border p-5 transition-transform hover:-translate-y-0.5 ${TONE_CLASSES[config.tone]}`}><div className="flex items-start justify-between gap-4"><span className="text-xs font-semibold tracking-[0.12em] text-text-muted">{item.number}</span><span aria-hidden="true" className="text-lg text-text-muted transition-transform group-hover:translate-x-1">→</span></div><p className="mt-8 text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">{intentCopy.eyebrow}</p><h3 className="mt-2 text-lg font-semibold text-text-primary">{intentCopy.title}</h3><p className="mt-2 text-sm leading-6 text-text-muted">{intentCopy.cardDescription}</p></Link>; })}</div></div></section>
        <section className="content-width flex flex-col gap-6 py-10 text-xs leading-5 text-text-muted sm:flex-row sm:items-start sm:justify-between"><p className="max-w-2xl">{copy.originalDocuments}</p><p className="max-w-sm sm:text-right">{copy.referenceDisclaimerLong}</p></section>
      </main>
    </div>
  );
}
