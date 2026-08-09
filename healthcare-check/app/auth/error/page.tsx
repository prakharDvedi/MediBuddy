import { Brand } from "@/components/app-shell";
import { ErrorState } from "@/components/ui";

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center"><Brand variant="full" /></div>
        <div className="surface p-6 text-center">
          <h1 className="mb-4 text-2xl font-semibold tracking-tight text-text-primary">Authentication error</h1>
          <ErrorState message={params.error ?? "An unspecified error occurred."} />
        </div>
      </div>
    </div>
  );
}
