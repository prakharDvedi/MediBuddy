import { createClient } from "@/lib/supabase/server";
import { DashboardActionCard } from "@/components/dashboard-action-card";
import { RecentCases } from "@/components/recent-cases";
import { AppShell } from "@/components/app-shell";
import { getRecentCases } from "@/lib/dashboard/data";
import { redirect } from "next/navigation";
import { DemoCaseActions } from "@/components/demo-case-actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) redirect("/login");

  const email = data.claims.email as string | undefined;
  const cases = await getRecentCases(supabase);

  return (
    <AppShell email={email}>
      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-success-bg/70 blur-3xl" />
        <div className="page-shell relative">
          <section className="soft-grid rounded-[1.25rem] border border-border bg-surface/60 p-5 sm:p-7">
            <h1 className="max-w-2xl text-3xl font-semibold leading-tight tracking-[-0.03em] text-text-primary sm:text-4xl">
              Understand your healthcare costs
            </h1>
            <p className="mt-2 max-w-xl text-base leading-7 text-text-muted">
              Review bills, check medicine and procedure references, and understand what your insurance may cover.
            </p>
          </section>

          <section aria-labelledby="start-check-heading" className="mt-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">Start a new check</p>
                <h2 id="start-check-heading" className="mt-1 text-2xl font-semibold tracking-tight text-text-primary">Choose your starting point</h2>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <DashboardActionCard intent="bill" />
              <DashboardActionCard intent="policy" />
              <DashboardActionCard intent="compare" />
            </div>
          </section>

          <DemoCaseActions />

          <RecentCases cases={cases} />
        </div>
      </main>
    </AppShell>
  );
}
