import { createClient } from "@/lib/supabase/server";
import { classifyAndExtractItems } from "@/lib/documents/structure";
import { maybeSetCaseTitle } from "@/lib/documents/case-title";
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
  if (document.doc_type === "policy") {
    return NextResponse.json({ docType: "policy", itemCount: 0, skipped: true });
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
    const result = await classifyAndExtractItems(
      pages.map((p) => ({ pageNumber: p.page_number, content: p.content ?? "" })),
    );

    await supabase.from("extracted_items").delete().eq("document_id", documentId);

    if (result.items.length > 0) {
      const { error: insertError } = await supabase.from("extracted_items").insert(
        result.items.map((item) => ({
          document_id: documentId,
          item_type: item.item_type,
          name: item.name,
          normalized_name: item.normalized_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          source_page: item.source_page,
          raw_text: item.raw_text,
          confidence: item.confidence,
          medicine_identity: item.medicine_identity,
        })),
      );
      if (insertError) throw new Error(insertError.message);
    }

    const updatedDocType = document.doc_type === "unknown" ? result.docType : document.doc_type;
    await supabase
      .from("documents")
      .update({ status: "structured", doc_type: updatedDocType })
      .eq("id", documentId);

    await maybeSetCaseTitle(supabase, documentId, result.suggestedTitle);

    return NextResponse.json({ docType: result.docType, itemCount: result.items.length });
  } catch (err) {
    await supabase.from("documents").update({ status: "error" }).eq("id", documentId);
    const message = err instanceof Error ? err.message : "Structured extraction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
