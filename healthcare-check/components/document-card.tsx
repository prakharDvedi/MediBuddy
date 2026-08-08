import { DocumentDetails } from "@/components/document-details";

const STATUS_LABELS: Record<string, string> = {
  uploaded: "Uploaded",
  processing: "Processing",
  extracted: "Extracted",
  structured: "Ready",
  error: "Error",
};

type Document = {
  id: string;
  doc_type: string | null;
  original_filename: string;
  mime_type: string | null;
  page_count: number | null;
  status: string;
};

export function DocumentCard({ doc }: { doc: Document }) {
  const isError = doc.status === "error";
  const isReady = doc.status === "structured";

  return (
    <div className="rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/[.02] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-black dark:text-zinc-50">
            {doc.original_filename}
          </p>
          <p className="text-xs text-zinc-500">
            {doc.doc_type ?? "unknown"} &middot; {doc.page_count ?? 0} page(s)
          </p>
        </div>
        <span
          className={
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium " +
            (isError
              ? "text-red-600 border border-red-200 dark:border-red-900"
              : isReady
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "border border-black/15 dark:border-white/15 text-zinc-600 dark:text-zinc-400")
          }
        >
          {STATUS_LABELS[doc.status] ?? doc.status}
        </span>
      </div>
      <DocumentDetails documentId={doc.id} />
    </div>
  );
}
