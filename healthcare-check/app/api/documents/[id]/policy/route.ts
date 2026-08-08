import { createClient } from "@/lib/supabase/server";
import { extractPolicyDetails } from "@/lib/documents/policy";
import { chunkPolicyPages } from "@/lib/rag/policy";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: documentId } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: document, error: docError } = await supabase
    .from("documents")
    .select("id, doc_type")
    .eq("id", documentId)
    .single();

  if (docError || !document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  if (document.doc_type !== "policy") {
    return NextResponse.json(
      { error: "Document is not classified as an insurance policy" },
      { status: 400 },
    );
  }

  const { data: pages, error: pagesError } = await supabase
    .from("document_pages")
    .select("page_number, content")
    .eq("document_id", documentId)
    .order("page_number", { ascending: true });

  if (pagesError) {
    return NextResponse.json({ error: pagesError.message }, { status: 500 });
  }
  if (!pages || pages.length === 0) {
    return NextResponse.json(
      { error: "No extracted text for this document yet — run extraction first." },
      { status: 400 },
    );
  }

  try {
    const policy = await extractPolicyDetails(
      pages.map((p) => ({ pageNumber: p.page_number, content: p.content ?? "" })),
    );

    const { error: upsertError } = await supabase.from("insurance_policies").upsert(
      {
        document_id: documentId,
        sum_insured: policy.sumInsured,
        room_rent_limit: policy.roomRentLimit,
        icu_limit: policy.icuLimit,
        copay_percent: policy.copayPercent,
        deductible: policy.deductible,
        waiting_periods: policy.waitingPeriods,
        sub_limits: policy.subLimits,
        exclusions: policy.exclusions,
        consumables_covered: policy.consumablesCovered,
        other_conditions: policy.otherConditions,
      },
      { onConflict: "document_id" },
    );
    if (upsertError) throw new Error(upsertError.message);

    const chunks = chunkPolicyPages(
      pages.map((p) => ({ pageNumber: p.page_number, content: p.content ?? "" })),
    );

    await supabase.from("policy_chunks").delete().eq("document_id", documentId);

    if (chunks.length > 0) {
      const { error: chunksError } = await supabase.from("policy_chunks").insert(
        chunks.map((chunk, index) => ({
          document_id: documentId,
          chunk_index: index,
          page: chunk.page,
          section_title: chunk.sectionTitle,
          content: chunk.content,
        })),
      );
      if (chunksError) throw new Error(chunksError.message);
    }

    return NextResponse.json({ ok: true, chunkCount: chunks.length });
  } catch (err) {
    await supabase.from("documents").update({ status: "error" }).eq("id", documentId);
    const message = err instanceof Error ? err.message : "Policy extraction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
