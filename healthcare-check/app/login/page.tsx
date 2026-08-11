"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Brand } from "@/components/app-shell";
import { ErrorState } from "@/components/ui";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useLocale } from "@/components/locale-provider";
import { APP_COPY } from "@/lib/i18n/app-copy";

export default function LoginPage() {
  const { locale } = useLocale();
  const copy = APP_COPY[locale].auth;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) { setError(signInError.message); setLoading(false); return; }
    router.push("/dashboard");
    router.refresh();
  }

  return <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10"><div className="w-full max-w-sm"><div className="mb-4 flex justify-end"><LocaleSwitcher /></div><div className="mb-8 flex justify-center"><Brand variant="full" /></div><form onSubmit={handleSubmit} className="surface flex flex-col gap-4 p-6 sm:p-7"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-info">{copy.welcomeBack}</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-text-primary">{copy.login}</h1><p className="mt-2 text-sm leading-6 text-text-muted">{copy.loginDescription}</p></div><div className="flex flex-col gap-1.5"><label htmlFor="email" className="text-sm font-medium text-text-primary">{copy.email}</label><input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="focus-ring min-h-11 rounded-xl border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary" /></div><div className="flex flex-col gap-1.5"><label htmlFor="password" className="text-sm font-medium text-text-primary">{copy.password}</label><input id="password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} className="focus-ring min-h-11 rounded-xl border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary" /></div>{error && <ErrorState message={error} />}<button type="submit" disabled={loading} className="focus-ring min-h-11 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50">{loading ? copy.loggingIn : copy.login}</button><p className="text-center text-sm text-text-muted">{copy.noAccount} <Link href="/signup" className="font-medium text-info underline underline-offset-4">{copy.signup}</Link></p></form></div></div>;
}
