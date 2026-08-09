import type { CghsReferenceRecordRow } from "../audit/types.ts";
import type { ReferenceSnapshotRow } from "../medicines/types.ts";

export function selectCurrentCghsRecords(
  records: CghsReferenceRecordRow[],
  snapshots: ReferenceSnapshotRow[],
): CghsReferenceRecordRow[] {
  const snapshotById = new Map(snapshots.map((snapshot) => [snapshot.id, snapshot]));
  const latestByRecord = new Map<string, CghsReferenceRecordRow>();

  for (const record of records) {
    const snapshot = snapshotById.get(record.snapshot_id);
    if (!snapshot || snapshot.source_kind !== "cghs" || snapshot.status !== "accepted") continue;
    const key = `${record.source_record_id}:${record.rate_context}`;
    const current = latestByRecord.get(key);
    if (!current) {
      latestByRecord.set(key, record);
      continue;
    }
    const currentSnapshot = snapshotById.get(current.snapshot_id);
    if ((snapshot.retrieved_at ?? "") > (currentSnapshot?.retrieved_at ?? "")) latestByRecord.set(key, record);
  }

  return [...latestByRecord.values()].sort((a, b) => a.source_record_id.localeCompare(b.source_record_id));
}
