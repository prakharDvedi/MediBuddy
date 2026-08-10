import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

function getSafeNext(value: string | null) {
  if (!value) return "/dashboard";

  try {
    const url = new URL(value, "http://localhost");

    if (url.origin !== "http://localhost" || !url.pathname.startsWith("/")) {
      return "/dashboard";
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/dashboard";
  }
}

function redirectToAuthError(message: string): never {
  redirect(`/auth/error?error=${encodeURIComponent(message)}`);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = getSafeNext(searchParams.get("next"));

  const providerError = searchParams.get("error_description") ?? searchParams.get("error");
  if (providerError) {
    redirectToAuthError(providerError);
  }

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      redirect(next);
    }

    if (error.code === "pkce_code_verifier_not_found") {
      redirectToAuthError(
        "This confirmation link was opened in a different browser or its signup session expired. Start signup again and open the new link in the same browser.",
      );
    }

    redirectToAuthError(error.message);
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      redirect(next);
    }
    redirectToAuthError(error.message);
  }

  redirectToAuthError("No confirmation code or token hash was provided");
}
