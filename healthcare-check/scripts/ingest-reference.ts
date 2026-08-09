import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { resolveMedicineIdentity } from "../lib/medicines/match.ts";
import {
  adaptNppaRows,
  adaptPmbiRows,
  snapshotContentHash,
  type NppaSourceRow,
  type PmbiSourceRow,
  type PreparedMedicineObservation,
  type SourceKind,
  type SourceMetadata,
} from "../lib/reference/ingestion.ts";
import {
  adaptCghsRows,
  cghsSnapshotContentHash,
  type CghsSourceRow,
} from "../lib/reference/cghs.ts";
import type { MedicineProductCandidate } from "../lib/medicines/types.ts";

const DEFAULT_SOURCE: Record<SourceKind, Omit<SourceMetadata, "sourceKind" | "retrievedAt" | "effectiveDate">> = {
  nppa: {
    sourceName: "NPPA IPDMS ceiling prices",
    sourceUrl: "https://nppaipdms.gov.in/HISUtilities/dashboard/dashBoardACTION.cnt?groupId=ODM=&dashboardFor=TlBQQQ==&hospitalCode=998&seatId=10001&isGlobal=1&isPreview=0",
  },
  pmbi: {
    sourceName: "Jan Aushadhi / PMBI listed MRP",
    sourceUrl: "https://janaushadhi.gov.in/product-portfolio/product-mrp-list",
  },
  cghs: {
    sourceName: "CGHS Rate List 2025",
    sourceUrl: "https://dgehs.delhi.gov.in/sites/default/files/DGHS/universal/cghs_rate.pdf",
  },
};

type ParsedArguments = {
  source: SourceKind;
  file: string;
  sourceName: string;
  sourceUrl: string;
  retrievedAt: string;
  effectiveDate: string | null;
  dryRun: boolean;
};

function argumentValue(args: string[], name: string): string | null {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] ?? null : null;
}

function usage(): string {
  return [
    "Usage:",
    "  npm run ingest:reference -- --source nppa|pmbi|cghs --file snapshot.json [options]",
    "",
    "Options:",
    "  --source-name <name>       Override the official source label",
    "  --source-url <url>         Override the official source URL",
    "  --retrieved-at <timestamp> ISO timestamp; defaults to now",
    "  --effective-date <date>    YYYY-MM-DD; optional for PMBI",
    "  --dry-run                  Validate and print the snapshot without writing",
  ].join("\n");
}

function parseArguments(args: string[]): ParsedArguments | null {
  const sourceValue = argumentValue(args, "--source");
  const file = argumentValue(args, "--file");
  if ((sourceValue !== "nppa" && sourceValue !== "pmbi" && sourceValue !== "cghs") || !file) return null;
  const source = sourceValue as SourceKind;
  const defaults = DEFAULT_SOURCE[source];
  return {
    source,
    file,
    sourceName: argumentValue(args, "--source-name") ?? defaults.sourceName,
    sourceUrl: argumentValue(args, "--source-url") ?? defaults.sourceUrl,
    retrievedAt: argumentValue(args, "--retrieved-at") ?? new Date().toISOString(),
    effectiveDate: argumentValue(args, "--effective-date"),
    dryRun: args.includes("--dry-run"),
  };
}

function rowsFromPayload(payload: unknown): unknown[] | null {
  if (Array.isArray(payload)) return payload;
  if (typeof payload === "object" && payload !== null && "rows" in payload) {
    const rows = payload.rows;
    return Array.isArray(rows) ? rows : null;
  }
  return null;
}

function printValidationIssues(issues: { row: number; field: string; message: string }[]): void {
  for (const issue of issues) console.error(`row ${issue.row}, ${issue.field}: ${issue.message}`);
}

async function main(): Promise<void> {
  const parsed = parseArguments(process.argv.slice(2));
  if (!parsed) {
    console.error(usage());
    process.exitCode = 1;
    return;
  }

  const payload = JSON.parse(await readFile(parsed.file, "utf8")) as unknown;
  const rawRows = rowsFromPayload(payload);
  if (!rawRows) throw new Error("Input JSON must be an array or an object with a rows array.");

  const metadata: SourceMetadata = {
    sourceKind: parsed.source,
    sourceName: parsed.sourceName,
    sourceUrl: parsed.sourceUrl,
    retrievedAt: parsed.retrievedAt,
    effectiveDate: parsed.effectiveDate,
  };
  const cghsAdapted = parsed.source === "cghs"
    ? adaptCghsRows(rawRows as CghsSourceRow[], metadata)
    : null;
  const medicineAdapted = parsed.source === "cghs"
    ? null
    : parsed.source === "nppa"
      ? adaptNppaRows(rawRows as NppaSourceRow[], metadata)
      : adaptPmbiRows(rawRows as PmbiSourceRow[], metadata);
  const adapted = cghsAdapted ?? medicineAdapted;
  if (!adapted) throw new Error("Could not adapt reference snapshot.");

  if (adapted.issues.length > 0) {
    printValidationIssues(adapted.issues);
    process.exitCode = 1;
    return;
  }
  if (adapted.rows.length === 0) throw new Error("Snapshot contains no valid rows.");

  const contentHash = parsed.source === "cghs"
    ? cghsSnapshotContentHash(cghsAdapted!)
    : snapshotContentHash(medicineAdapted!);
  console.log(JSON.stringify({ source: parsed.source, rows: adapted.rows.length, contentHash, dryRun: parsed.dryRun }, null, 2));
  if (parsed.dryRun) return;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: existingSnapshot, error: existingError } = await supabase
    .from("reference_snapshots")
    .select("id, status")
    .eq("source_kind", parsed.source)
    .eq("content_hash", contentHash)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);
  if (existingSnapshot) {
    console.log(`Snapshot already exists: ${existingSnapshot.id} (${existingSnapshot.status}). Nothing written.`);
    return;
  }

  const { data: snapshotData, error: snapshotError } = await supabase
    .from("reference_snapshots")
    .insert({
      source_kind: parsed.source,
      source_name: parsed.sourceName,
      source_url: parsed.sourceUrl,
      retrieved_at: parsed.retrievedAt,
      effective_date: parsed.effectiveDate,
      content_hash: contentHash,
      status: "staged",
      row_count: 0,
      validation_errors: [],
      raw_metadata: { input_file: parsed.file },
    })
    .select("id")
    .single();
  if (snapshotError || !snapshotData) throw new Error(snapshotError?.message ?? "Could not create staged snapshot.");

  try {
    if (parsed.source === "cghs") {
      const records = cghsAdapted!.rows.map((row) => ({
        snapshot_id: snapshotData.id,
        source_record_id: row.source_record_id,
        code: row.code,
        record_kind: row.record_kind,
        category: row.category,
        description: row.description,
        normalized_name: row.normalized_name,
        rate: row.rate,
        rate_unit: row.rate_unit,
        rate_context: row.rate_context,
        room_type: row.room_type,
        inclusion_notes: row.inclusion_notes,
        exclusion_notes: row.exclusion_notes,
        applicability_conditions: row.applicability_conditions,
        source_page: row.source_page,
        source_section: row.source_section,
        raw_source: row.raw_source,
      }));
      const { error: recordError } = await supabase.from("cghs_reference_records").insert(records);
      if (recordError) throw new Error(recordError.message);
      const { error: acceptError } = await supabase
        .from("reference_snapshots")
        .update({ status: "accepted", row_count: records.length })
        .eq("id", snapshotData.id);
      if (acceptError) throw new Error(acceptError.message);
      console.log(`Accepted CGHS snapshot ${snapshotData.id} with ${records.length} records.`);
      return;
    }

    const { data: productData, error: productError } = await supabase
      .from("medicine_products")
      .select("id, canonical_name, normalized_identity, dosage_form, route");
    if (productError) throw new Error(productError.message);

    const products = (productData ?? []) as MedicineProductCandidate[];
    const unresolvedRows: PreparedMedicineObservation[] = [];
    const productIdByRow = new Map<string, string>();

    for (const row of medicineAdapted!.rows) {
      const resolution = resolveMedicineIdentity(row.identity, row.canonical_name, row.normalized_identity, products, []);
      if (resolution.status === "needs_review" || resolution.status === "combination_unresolved") {
        throw new Error(`Existing medicine catalog needs review for source row ${row.source_record_id}: ${resolution.reason}`);
      }
      if (resolution.product_id) {
        productIdByRow.set(row.source_record_id, resolution.product_id);
      } else {
        unresolvedRows.push(row);
      }
    }

    const newProductRows = [...new Map(unresolvedRows.map((row) => [row.normalized_identity, row])).values()].map((row) => ({
      canonical_name: row.canonical_name,
      normalized_identity: row.normalized_identity,
      dosage_form: row.dosage_form,
      route: row.route,
    }));
    if (newProductRows.length > 0) {
      const { error: upsertError } = await supabase
        .from("medicine_products")
        .upsert(newProductRows, { onConflict: "normalized_identity" });
      if (upsertError) throw new Error(upsertError.message);
    }

    if (unresolvedRows.length > 0) {
      const identities = unresolvedRows.map((row) => row.normalized_identity);
      const { data: insertedProducts, error: insertedProductError } = await supabase
        .from("medicine_products")
        .select("id, normalized_identity")
        .in("normalized_identity", identities);
      if (insertedProductError) throw new Error(insertedProductError.message);
      const productIds = new Map((insertedProducts ?? []).map((product) => [product.normalized_identity as string, product.id as string]));
      for (const row of unresolvedRows) {
        const productId = productIds.get(row.normalized_identity);
        if (!productId) throw new Error(`Could not resolve inserted medicine product for ${row.normalized_identity}.`);
        productIdByRow.set(row.source_record_id, productId);
      }
    }

    const observations = medicineAdapted!.rows.map((row) => ({
      snapshot_id: snapshotData.id,
      medicine_product_id: productIdByRow.get(row.source_record_id),
      source_kind: row.source_kind,
      source_record_id: row.source_record_id,
      price_kind: row.price_kind,
      amount: row.amount,
      currency: row.currency,
      sale_unit: row.sale_unit,
      pack_text: row.pack_text,
      pack_quantity: row.pack_quantity,
      pack_unit: row.pack_unit,
      tax_status: row.tax_status,
      effective_date: row.effective_date,
      observed_at: row.observed_at,
      source_name: row.source_name,
      source_url: row.source_url,
      raw_source: row.raw_source,
    }));
    const { error: observationError } = await supabase.from("medicine_price_observations").insert(observations);
    if (observationError) throw new Error(observationError.message);

    const { error: acceptError } = await supabase
      .from("reference_snapshots")
      .update({ status: "accepted", row_count: observations.length })
      .eq("id", snapshotData.id);
    if (acceptError) throw new Error(acceptError.message);
    console.log(`Accepted snapshot ${snapshotData.id} with ${observations.length} observations.`);
  } catch (error) {
    await supabase
      .from("reference_snapshots")
      .update({ status: "rejected", validation_errors: [{ message: error instanceof Error ? error.message : String(error) }] })
      .eq("id", snapshotData.id);
    throw error;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
