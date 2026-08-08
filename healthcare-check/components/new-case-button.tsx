"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function NewCaseButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    const res = await fetch("/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      router.push(`/case/${data.case.id}`);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-full bg-black dark:bg-white text-white dark:text-black px-5 py-2.5 text-sm font-medium disabled:opacity-50"
    >
      {loading ? "Creating..." : "New case"}
    </button>
  );
}
