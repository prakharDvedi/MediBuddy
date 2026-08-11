"use client";

import { resendSignupConfirmation, signUpWithEmail } from "@/app/signup/actions";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Brand } from "@/components/app-shell";
import { ErrorState } from "@/components/ui";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useLocale } from "@/components/locale-provider";
import { APP_COPY, fillAppTemplate } from "@/lib/i18n/app-copy";

export default function SignUpPage() {
  const { locale } = useLocale();
  const copy = APP_COPY[locale].auth;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => { if (resendCooldown === 0) return; const timer = window.setInterval(() => setResendCooldown((current) => current <= 1 ? 0 : current - 1), 1000); return () => window.clearInterval(timer); }, [resendCooldown]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setError(null);
    const result = await signUpWithEmail(email, password); setLoading(false);
    if (result.status === "error") { setError(result.error); return; }
    setSubmitted(true);
  }

  async function handleResend() {
    if (resendLoading || resendCooldown > 0) return;
    setResendLoading(true); setResendError(null); setResendNotice(null);
    const result = await resendSignupConfirmation(email); setResendLoading(false);
    if (result.error) { setResendError(result.error); return; }
    setResendNotice(copy.confirmationRequested); setResendCooldown(60);
  }

  if (submitted) return <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10"><div className="w-full max-w-sm"><div className="mb-4 flex justify-end"><LocaleSwitcher /></div><div className="surface p-6 text-center sm:p-7"><div className="mb-7 flex justify-center"><Brand variant="full" /></div><h1 className="mb-2 text-2xl font-semibold tracking-tight text-text-primary">{copy.checkEmail}</h1><p className="text-sm leading-6 text-text-muted">{fillAppTemplate(copy.confirmationDescription, { email })}</p><div className="mt-5 flex flex-col gap-3"><button type="button" onClick={() => void handleResend()} disabled={resendLoading || resendCooldown > 0} className="focus-ring min-h-11 rounded-xl border border-border-strong px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-elevated disabled:opacity-50">{resendLoading ? copy.requestingLink : resendCooldown > 0 ? fillAppTemplate(copy.tryAgainIn, { seconds: resendCooldown }) : copy.resendConfirmation}</button><Link href="/login" className="focus-ring rounded-lg text-center text-sm font-medium text-info underline underline-offset-4">{copy.loginInstead}</Link></div>{resendNotice && <p className="mt-4 text-sm text-success">{resendNotice}</p>}{resendError && <div className="mt-4"><ErrorState message={resendError} /></div>}</div></div></div>;

  return <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10"><div className="w-full max-w-sm"><div className="mb-4 flex justify-end"><LocaleSwitcher /></div><div className="mb-8 flex justify-center"><Brand variant="full" /></div><form onSubmit={handleSubmit} className="surface flex flex-col gap-4 p-6 sm:p-7"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-info">{copy.calmerWay}</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-text-primary">{copy.signup}</h1><p className="mt-2 text-sm leading-6 text-text-muted">{copy.signupDescription}</p></div><div className="flex flex-col gap-1.5"><label htmlFor="email" className="text-sm font-medium text-text-primary">{copy.email}</label><input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="focus-ring min-h-11 rounded-xl border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary" /></div><div className="flex flex-col gap-1.5"><label htmlFor="password" className="text-sm font-medium text-text-primary">{copy.password}</label><input id="password" type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} className="focus-ring min-h-11 rounded-xl border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary" /></div>{error && <ErrorState message={error} />}<button type="submit" disabled={loading} className="focus-ring min-h-11 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50">{loading ? copy.signingUp : copy.signup}</button><p className="text-center text-sm text-text-muted">{copy.alreadyHaveAccount} <Link href="/login" className="font-medium text-info underline underline-offset-4">{copy.login}</Link></p></form></div></div>;
}
