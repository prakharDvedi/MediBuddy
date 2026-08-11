import { createClient } from "@/lib/supabase/server";
import { NewCaseShell } from "@/components/new-case-shell";
import { parseCaseIntent } from "@/lib/cases/intents";
import { redirect } from "next/navigation";
import { AppShell, BackLink } from "@/components/app-shell";

export default async function NewCasePage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string | string[] }>;
}) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();

  if (!auth?.claims) {
    redirect("/login");
  }

  const { intent: rawIntent } = await searchParams;
  const intent = parseCaseIntent(rawIntent);

  return (
    <AppShell context="newCheck">
      <main className="page-shell-narrow">
        <BackLink />
        <NewCaseShell intent={intent} />
      </main>
    </AppShell>
  );
}
