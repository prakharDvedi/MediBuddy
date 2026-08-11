import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { DashboardContent } from "@/components/dashboard-content";
import { getRecentCases } from "@/lib/dashboard/data";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) redirect("/login");

  const email = data.claims.email as string | undefined;
  const cases = await getRecentCases(supabase);

  return (
    <AppShell email={email}>
      <DashboardContent cases={cases} />
    </AppShell>
  );
}
