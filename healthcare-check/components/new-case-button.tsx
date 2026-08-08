import Link from "next/link";

export function NewCaseButton() {
  return (
    <Link
      href="/case/new"
      className="rounded-full bg-black dark:bg-white text-white dark:text-black px-5 py-2.5 text-sm font-medium"
    >
      New case
    </Link>
  );
}
