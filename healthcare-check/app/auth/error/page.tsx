export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black px-4">
      <div className="w-full max-w-sm rounded-lg border border-black/10 dark:border-white/10 p-6 text-center">
        <h2 className="mb-2 text-lg font-medium text-black dark:text-zinc-50">
          Authentication error
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {params.error ?? "An unspecified error occurred."}
        </p>
      </div>
    </div>
  );
}
