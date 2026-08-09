import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";
import { DashboardActionCard } from "@/components/dashboard-action-card";
import { RecentCases } from "@/components/recent-cases";
import { getRecentCases } from "@/lib/dashboard/data";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/login");
  }

  const email = data.claims.email as string | undefined;

  const cases = await getRecentCases(supabase);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <nav className="flex items-center justify-between border-b border-black/10 dark:border-white/10 px-6 py-4">
        <span className="font-semibold text-black dark:text-zinc-50">Healthcare Check</span>
        <div className="flex items-center gap-4">
          {email && (
            <span className="hidden text-sm text-zinc-600 dark:text-zinc-400 sm:inline">
              {email}
            </span>
          )}
          <LogoutButton />
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-6 sm:py-12">
        <section aria-labelledby="dashboard-heading" className="max-w-2xl">
          <h1 id="dashboard-heading" className="text-3xl font-semibold leading-tight text-black dark:text-zinc-50 sm:text-4xl">
            What do you want to check today?
          </h1>
          <p className="mt-3 text-base leading-7 text-zinc-600 dark:text-zinc-400">
            Choose what you want to check, then upload your document.
          </p>
        </section>

        <section aria-label="Start a check" className="mt-7 grid gap-3 md:grid-cols-3">
          <DashboardActionCard intent="bill" />
          <DashboardActionCard intent="policy" />
          <DashboardActionCard intent="compare" />
        </section>

        <RecentCases cases={cases} />
      </main>
    </div>
  );
}
