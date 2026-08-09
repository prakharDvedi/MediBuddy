import Link from "next/link";

export function NewCaseButton() {
  return (
    <Link
      href="/case/new"
      className="focus-ring inline-flex min-h-10 items-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
    >
      New case
    </Link>
  );
}
