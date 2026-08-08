import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";
import { NewCaseButton } from "@/components/new-case-button";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/login");
  }

  const email = data.claims.email as string | undefined;

  const { data: cases } = await supabase
    .from("cases")
    .select("id, title, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <nav className="flex items-center justify-between border-b border-black/10 dark:border-white/10 px-6 py-4">
        <span className="font-semibold text-black dark:text-zinc-50">
          Healthcare Check
        </span>
        <div className="flex items-center gap-4">
          {email && (
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {email}
            </span>
          )}
          <LogoutButton />
        </div>
      </nav>
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            Your cases
          </h1>
          <NewCaseButton />
        </div>

        {!cases || cases.length === 0 ? (
          <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
            You have no cases yet. Create one to upload a document.
          </p>
        ) : (
          <ul className="mt-6 flex flex-col gap-2">
            {cases.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/case/${c.id}`}
                  className="flex items-center justify-between rounded-lg border border-black/10 dark:border-white/10 px-4 py-3 hover:bg-black/[.02] dark:hover:bg-white/[.04]"
                >
                  <span className="text-sm font-medium text-black dark:text-zinc-50">
                    {c.title}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {new Date(c.created_at).toLocaleString()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
