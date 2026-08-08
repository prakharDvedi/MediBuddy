import Link from "next/link";

const HOSPITAL_STEPS = [
  "Upload a hospital estimate or bill (PDF or photo).",
  "Get a line-by-line breakdown, flagged against reference prices, duplicates, and vague charges.",
  "Leave with specific, ready-to-ask questions for the billing desk — evidence and page numbers included.",
];

const INSURANCE_STEPS = [
  "Upload your policy document.",
  "Ask it plain questions and get answers grounded in your policy's own text, cited by page and section.",
  "Compare it against a bill to see exactly what you'd pay, and why, before you commit to anything.",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <nav className="flex items-center justify-between border-b border-black/10 dark:border-white/10 px-6 py-4">
        <span className="font-semibold text-black dark:text-zinc-50">Healthcare Check</span>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm text-zinc-600 dark:text-zinc-400 hover:underline">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium"
          >
            Sign up
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="text-4xl font-semibold leading-tight text-black dark:text-zinc-50 sm:text-5xl">
          Understand your healthcare costs before you pay.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
          Upload a hospital bill or an insurance policy. Get a plain breakdown of what&apos;s
          being charged, what your policy actually covers, and exactly what to ask before you
          hand over money.
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/signup"
            className="rounded-full bg-black dark:bg-white text-white dark:text-black px-6 py-3 text-sm font-medium"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-black/15 dark:border-white/15 px-6 py-3 text-sm font-medium text-black dark:text-zinc-50"
          >
            Log in
          </Link>
        </div>

        <div className="mt-20 grid gap-10 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Hospital bills
            </p>
            <ol className="mt-3 flex flex-col gap-3">
              {HOSPITAL_STEPS.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                  <span className="text-zinc-400">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Insurance policies
            </p>
            <ol className="mt-3 flex flex-col gap-3">
              {INSURANCE_STEPS.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                  <span className="text-zinc-400">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <p className="mt-16 border-t border-black/5 dark:border-white/10 pt-6 text-xs text-zinc-500">
          Reference prices are hand-curated demo data, not a live authoritative feed — every
          flagged charge tells you where the comparison came from, and nothing here replaces
          confirming directly with your hospital or insurer.
        </p>
      </main>
    </div>
  );
}
