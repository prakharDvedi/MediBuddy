import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";
import { NewCaseShell } from "@/components/new-case-shell";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function NewCasePage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();

  if (!auth?.claims) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <nav className="flex items-center justify-between border-b border-black/10 dark:border-white/10 px-6 py-4">
        <Link href="/dashboard" className="font-semibold text-black dark:text-zinc-50">
          Healthcare Check
        </Link>
        <LogoutButton />
      </nav>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <Link href="/dashboard" className="text-sm text-zinc-500 hover:underline">
          &larr; Back to cases
        </Link>
        <NewCaseShell />
      </main>
    </div>
  );
}
