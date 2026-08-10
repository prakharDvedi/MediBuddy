"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getOrigin(requestHeaders: Headers) {
  const origin = requestHeaders.get("origin");
  if (origin) return origin;

  const forwardedHost = requestHeaders.get("x-forwarded-host");
  const host = forwardedHost ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  return host ? `${protocol}://${host}` : "http://localhost:3000";
}

export async function signUpWithEmail(email: string, password: string) {
  const requestHeaders = await headers();
  const supabase = await createClient();
  const emailRedirectTo = `${getOrigin(requestHeaders)}/auth/confirm`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo },
  });

  if (error) return { status: "error" as const, error: error.message };

  if (data.session) {
    redirect("/dashboard");
  }

  return { status: "confirmation_required" as const, error: null };
}

export async function resendSignupConfirmation(email: string) {
  const requestHeaders = await headers();
  const supabase = await createClient();
  const emailRedirectTo = `${getOrigin(requestHeaders)}/auth/confirm`;

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo },
  });

  return error ? { error: error.message } : { error: null };
}
