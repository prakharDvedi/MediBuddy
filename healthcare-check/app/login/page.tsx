"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Brand } from "@/components/app-shell";
import { ErrorState } from "@/components/ui";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center"><Brand variant="full" /></div>
        <form
          onSubmit={handleSubmit}
          className="surface flex flex-col gap-4 p-6 sm:p-7"
        >
          <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-info">Welcome back</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-text-primary">
            Log in
          </h1><p className="mt-2 text-sm leading-6 text-text-muted">Return to your saved bills, policy summaries, and questions.</p></div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-text-primary">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="focus-ring min-h-11 rounded-xl border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-text-primary">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="focus-ring min-h-11 rounded-xl border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary"
            />
          </div>
          {error && <ErrorState message={error} />}
          <button
            type="submit"
            disabled={loading}
            className="focus-ring min-h-11 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
          <p className="text-center text-sm text-text-muted">
            No account?{" "}
            <Link href="/signup" className="font-medium text-info underline underline-offset-4">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
