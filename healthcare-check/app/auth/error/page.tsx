import { AuthErrorContent } from "@/components/auth-error-content";

export default async function AuthErrorPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return <AuthErrorContent message={params.error ?? ""} />;
}
