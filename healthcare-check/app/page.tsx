import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black px-4 text-center">
      <h1 className="text-4xl font-semibold text-black dark:text-zinc-50">
        Healthcare Check
      </h1>
      <p className="mt-3 max-w-md text-lg text-zinc-600 dark:text-zinc-400">
        Understand your healthcare costs before you pay.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/login"
          className="rounded-full bg-black dark:bg-white text-white dark:text-black px-6 py-3 text-sm font-medium"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="rounded-full border border-black/15 dark:border-white/15 px-6 py-3 text-sm font-medium text-black dark:text-zinc-50"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
