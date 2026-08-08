import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const DOC_TYPES = ["estimate", "bill", "prescription", "quotation", "policy", "approval", "unknown"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: caseId } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = auth.claims.sub as string;

  const body = await request.json().catch(() => ({}));
  const { filename, mimeType, docType } = body as {
    filename?: string;
    mimeType?: string;
    docType?: string;
  };

  if (!filename || !mimeType) {
    return NextResponse.json({ error: "filename and mimeType are required" }, { status: 400 });
  }
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return NextResponse.json(
      { error: `Unsupported file type. Allowed: PDF, JPG, PNG.` },
      { status: 400 },
    );
  }

  // Ownership check happens implicitly: RLS only lets this insert succeed
  // if the case actually belongs to the caller.
  const { data: document, error: docError } = await supabase
    .from("documents")
    .insert({
      case_id: caseId,
      original_filename: filename,
      mime_type: mimeType,
      doc_type: docType && DOC_TYPES.includes(docType) ? docType : "unknown",
      status: "created",
    })
    .select("id")
    .single();

  if (docError || !document) {
    return NextResponse.json(
      { error: docError?.message ?? "Could not create document (case not found or not yours)" },
      { status: 400 },
    );
  }

  const extension = filename.includes(".") ? filename.split(".").pop() : "";
  const storagePath = `${userId}/${caseId}/${document.id}${extension ? `.${extension}` : ""}`;

  const { data: signed, error: signError } = await supabase.storage
    .from("documents")
    .createSignedUploadUrl(storagePath);

  if (signError || !signed) {
    return NextResponse.json({ error: signError?.message ?? "Could not create upload URL" }, { status: 500 });
  }

  await supabase.from("documents").update({ storage_path: storagePath }).eq("id", document.id);

  return NextResponse.json(
    {
      documentId: document.id,
      storagePath,
      signedUrl: signed.signedUrl,
      token: signed.token,
    },
    { status: 201 },
  );
}
