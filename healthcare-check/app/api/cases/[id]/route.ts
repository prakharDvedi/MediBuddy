import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: caseRow, error: caseError } = await supabase
    .from("cases")
    .select("id, title, status, created_at")
    .eq("id", id)
    .single();

  if (caseError || !caseRow) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  const { data: documents, error: docsError } = await supabase
    .from("documents")
    .select("id, doc_type, original_filename, mime_type, page_count, status, created_at")
    .eq("case_id", id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (docsError) {
    return NextResponse.json({ error: docsError.message }, { status: 500 });
  }

  return NextResponse.json({ case: caseRow, documents });
}
