import type { createClient } from "@/lib/supabase/server";
import { runAuditEngine } from "@/lib/audit/run";
import {
  DEMO_BILL_FIXTURE,
  DEMO_INSURANCE_FIXTURE,
  DEMO_QUESTION_SEEDS,
  type DemoDocumentFixture,
} from "@/lib/demo/fixtures";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
export type DemoCaseKind = "bill" | "insurance";

type CreatedDemoCase = {
  id: string;
  title: string;
  status: string;
  created_at: string;
};

function errorMessage(error: { message?: string } | null, fallback: string): string {
  return error?.message ?? fallback;
}

async function assertReferenceFixtures(supabase: SupabaseServerClient): Promise<void> {
  const { data: nppaProduct, error: nppaProductError } = await supabase
    .from("medicine_products")
    .select("id")
    .eq("normalized_identity", DEMO_BILL_FIXTURE.references.nppa.normalizedIdentity)
    .maybeSingle();
  if (nppaProductError || !nppaProduct) {
    throw new Error(errorMessage(nppaProductError, "The NPPA demo reference product is not available."));
  }

  const { data: nppaObservation, error: nppaError } = await supabase
    .from("medicine_price_observations")
    .select("id, sale_unit")
    .eq("medicine_product_id", nppaProduct.id)
    .eq("source_kind", "nppa")
    .eq("sale_unit", DEMO_BILL_FIXTURE.references.nppa.saleUnit)
    .limit(1)
    .maybeSingle();
  if (nppaError || !nppaObservation) {
    throw new Error(errorMessage(nppaError, "The NPPA demo sale unit is not available."));
  }

  const { data: pmbiProduct, error: pmbiProductError } = await supabase
    .from("medicine_products")
    .select("id")
    .eq("normalized_identity", DEMO_BILL_FIXTURE.references.pmbi.normalizedIdentity)
    .maybeSingle();
  if (pmbiProductError || !pmbiProduct) {
    throw new Error(errorMessage(pmbiProductError, "The PMBI demo reference product is not available."));
  }

  const { data: pmbiObservation, error: pmbiError } = await supabase
    .from("medicine_price_observations")
    .select("id, sale_unit, pack_quantity, pack_unit")
    .eq("medicine_product_id", pmbiProduct.id)
    .eq("source_kind", "pmbi")
    .eq("sale_unit", DEMO_BILL_FIXTURE.references.pmbi.saleUnit)
    .eq("pack_quantity", DEMO_BILL_FIXTURE.references.pmbi.packQuantity)
    .eq("pack_unit", DEMO_BILL_FIXTURE.references.pmbi.packUnit)
    .limit(1)
    .maybeSingle();
  if (pmbiError || !pmbiObservation) {
    throw new Error(errorMessage(pmbiError, "The PMBI demo pack unit is not available."));
  }

  const { data: cghsSnapshots, error: snapshotsError } = await supabase
    .from("reference_snapshots")
    .select("id")
    .eq("source_kind", "cghs")
    .eq("status", "accepted");
  if (snapshotsError || !cghsSnapshots || cghsSnapshots.length === 0) {
    throw new Error(errorMessage(snapshotsError, "The accepted CGHS demo snapshot is not available."));
  }

  const { data: cghsRecord, error: cghsError } = await supabase
    .from("cghs_reference_records")
    .select("id, normalized_name, rate, rate_context")
    .eq("normalized_name", DEMO_BILL_FIXTURE.references.cghs.normalizedName)
    .eq("rate", DEMO_BILL_FIXTURE.references.cghs.rate)
    .eq("rate_context", DEMO_BILL_FIXTURE.references.cghs.rateContext)
    .in("snapshot_id", cghsSnapshots.map((snapshot) => snapshot.id))
    .limit(1)
    .maybeSingle();
  if (cghsError || !cghsRecord) {
    throw new Error(errorMessage(cghsError, "The comparable CGHS Consultation OPD reference is not available."));
  }
}

async function insertDocument(
  supabase: SupabaseServerClient,
  caseId: string,
  fixture: DemoDocumentFixture,
): Promise<string> {
  const { data: document, error: documentError } = await supabase
    .from("documents")
    .insert({
      case_id: caseId,
      storage_path: null,
      doc_type: fixture.doc_type,
      original_filename: fixture.original_filename,
      mime_type: "application/pdf",
      page_count: fixture.pages.length,
      status: "structured",
    })
    .select("id")
    .single();
  if (documentError || !document) {
    throw new Error(errorMessage(documentError, "Could not create the synthetic document."));
  }

  const { error: pagesError } = await supabase.from("document_pages").insert(
    fixture.pages.map((page) => ({
      document_id: document.id,
      page_number: page.page_number,
      content: page.content,
    })),
  );
  if (pagesError) throw new Error(pagesError.message);

  if (fixture.items && fixture.items.length > 0) {
    const { error: itemsError } = await supabase.from("extracted_items").insert(
      fixture.items.map((item) => ({
        document_id: document.id,
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
    if (itemsError) throw new Error(itemsError.message);
  }

  return document.id;
}

async function insertPolicy(
  supabase: SupabaseServerClient,
  documentId: string,
): Promise<void> {
  const { error } = await supabase.rpc("replace_policy_extraction", {
    p_document_id: documentId,
    p_policy: DEMO_INSURANCE_FIXTURE.policy,
    p_provenance: DEMO_INSURANCE_FIXTURE.policyProvenance,
    p_chunks: DEMO_INSURANCE_FIXTURE.documents[1].pages.map((page, index) => ({
      chunk_index: index,
      page: page.page_number,
      section_title: page.content.match(/Section \d+/)?.[0] ?? null,
      content: page.content,
    })),
  });
  if (error) throw new Error(error.message);
}

function questionForFinding(findingType: string): string {
  return (
    DEMO_QUESTION_SEEDS.find((seed) => seed.findingType === findingType)?.question ??
    "Could you clarify this item and point me to the supporting document detail?"
  );
}

async function seedQuestions(
  supabase: SupabaseServerClient,
  caseId: string,
): Promise<void> {
  const { data: findings, error: findingsError } = await supabase
    .from("audit_findings")
    .select("id, finding_type")
    .eq("case_id", caseId)
    .order("created_at", { ascending: true });
  if (findingsError) throw new Error(findingsError.message);

  if (!findings || findings.length === 0) return;

  const { error: questionsError } = await supabase.from("questions").insert(
    findings.map((finding) => ({
      case_id: caseId,
      finding_id: finding.id,
      question_text: questionForFinding(finding.finding_type),
    })),
  );
  if (questionsError) throw new Error(questionsError.message);
}

export async function createDemoCase(
  supabase: SupabaseServerClient,
  userId: string,
  kind: DemoCaseKind,
): Promise<CreatedDemoCase> {
  if (kind === "bill") await assertReferenceFixtures(supabase);

  const fixture = kind === "bill" ? DEMO_BILL_FIXTURE : DEMO_INSURANCE_FIXTURE;
  let caseId: string | null = null;

  try {
    const { data: caseRow, error: caseError } = await supabase
      .from("cases")
      .insert({ user_id: userId, title: fixture.title, status: "processing" })
      .select("id, title, status, created_at")
      .single();
    if (caseError || !caseRow) {
      throw new Error(errorMessage(caseError, "Could not create the synthetic case."));
    }
    caseId = caseRow.id;
    const createdCaseId = caseRow.id;

    const documentIds: string[] = [];
    for (const documentFixture of fixture.documents) {
      documentIds.push(await insertDocument(supabase, createdCaseId, documentFixture));
    }

    if (kind === "insurance") {
      const policyDocumentId = documentIds.find((documentId, index) => fixture.documents[index].doc_type === "policy");
      if (!policyDocumentId) throw new Error("The synthetic policy document was not created.");
      await insertPolicy(supabase, policyDocumentId);
    }

    await runAuditEngine(supabase, createdCaseId);
    await seedQuestions(supabase, createdCaseId);

    const { data: readyCase, error: readyError } = await supabase
      .from("cases")
      .update({ status: "ready" })
      .eq("id", createdCaseId)
      .select("id, title, status, created_at")
      .single();
    if (readyError || !readyCase) {
      throw new Error(errorMessage(readyError, "Could not finalize the synthetic case."));
    }

    return readyCase as CreatedDemoCase;
  } catch (error) {
    if (caseId) {
      await supabase.from("cases").delete().eq("id", caseId);
    }
    throw error;
  }
}
