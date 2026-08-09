import { DocumentDetails } from "@/components/document-details";
import { documentStatusLabel, documentStatusTone } from "@/lib/presentation";
import { StatusBadge } from "@/components/ui";

type Document = {
  id: string;
  doc_type: string | null;
  original_filename: string;
  mime_type: string | null;
  page_count: number | null;
  status: string;
};

export function DocumentCard({ doc }: { doc: Document }) {
  return (
    <div className="surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-info-bg text-sm font-semibold text-info">▤</div>
          <div className="min-w-0"><p className="truncate text-sm font-semibold text-text-primary">{doc.original_filename}</p><p className="mt-1 text-xs text-text-muted">{doc.doc_type ?? "Document type not confirmed"} · {doc.page_count ?? 0} page(s)</p></div>
        </div>
        <StatusBadge tone={documentStatusTone(doc.status)}>{documentStatusLabel(doc.status)}</StatusBadge>
      </div>
      <DocumentDetails documentId={doc.id} />
    </div>
  );
}
