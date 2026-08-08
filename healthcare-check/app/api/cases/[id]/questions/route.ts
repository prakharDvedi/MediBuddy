import { createClient } from "@/lib/supabase/server";
import { generateQuestions } from "@/lib/documents/questions";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: caseId } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: caseRow, error: caseError } = await supabase
    .from("cases")
    .select("id")
    .eq("id", caseId)
    .single();
  if (caseError || !caseRow) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  const { data: findings, error: findingsError } = await supabase
    .from("audit_findings")
    .select("id, finding_type, title, description")
    .eq("case_id", caseId);
  if (findingsError) {
    return NextResponse.json({ error: findingsError.message }, { status: 500 });
  }
  if (!findings || findings.length === 0) {
    return NextResponse.json({ questionsCount: 0 });
  }

  try {
    const knownFindingIds = new Set(findings.map((f) => f.id));
    const generated = await generateQuestions(findings);

    await supabase.from("questions").delete().eq("case_id", caseId);

    if (generated.length > 0) {
      const { error: insertError } = await supabase.from("questions").insert(
        generated.map((q) => ({
          case_id: caseId,
          finding_id: q.findingId && knownFindingIds.has(q.findingId) ? q.findingId : null,
          question_text: q.question,
        })),
      );
      if (insertError) throw new Error(insertError.message);
    }

    return NextResponse.json({ questionsCount: generated.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Question generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
