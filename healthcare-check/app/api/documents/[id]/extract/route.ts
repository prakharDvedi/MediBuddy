import { createClient } from "@/lib/supabase/server";
import { extractDocumentPages } from "@/lib/documents/extract";
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
    .select("id, storage_path, mime_type")
    .eq("id", documentId)
    .single();

  if (docError || !document || !document.storage_path || !document.mime_type) {
    return NextResponse.json({ error: "Document not found or not yet uploaded" }, { status: 404 });
  }

  await supabase.from("documents").update({ status: "processing" }).eq("id", documentId);

  const { data: fileBlob, error: downloadError } = await supabase.storage
    .from("documents")
    .download(document.storage_path);

  if (downloadError || !fileBlob) {
    await supabase.from("documents").update({ status: "error" }).eq("id", documentId);
    return NextResponse.json(
      { error: downloadError?.message ?? "Could not download uploaded file" },
      { status: 500 },
    );
  }

  try {
    const buffer = Buffer.from(await fileBlob.arrayBuffer());
    const pages = await extractDocumentPages(buffer, document.mime_type);

    const { error: pagesError } = await supabase
      .from("document_pages")
      .upsert(
        pages.map((p) => ({
          document_id: documentId,
          page_number: p.pageNumber,
          content: p.content,
        })),
        { onConflict: "document_id,page_number" },
      );

    if (pagesError) throw new Error(pagesError.message);

    await supabase
      .from("documents")
      .update({ status: "extracted", page_count: pages.length })
      .eq("id", documentId);

    return NextResponse.json({ pageCount: pages.length });
  } catch (err) {
    await supabase.from("documents").update({ status: "error" }).eq("id", documentId);
    const message = err instanceof Error ? err.message : "Extraction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
