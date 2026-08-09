import { createDemoCase } from "@/lib/demo/create-case";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = typeof auth?.claims?.sub === "string" ? auth.claims.sub : null;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const demoCase = await createDemoCase(supabase, userId, "bill");
    return NextResponse.json({ case: demoCase }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create the synthetic bill case";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
