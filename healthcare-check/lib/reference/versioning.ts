import type { MedicinePriceObservation, ReferenceSnapshotRow } from "../medicines/types.ts";

type VersionedObservation = MedicinePriceObservation & { snapshot_id?: string | null };

function observationKey(observation: MedicinePriceObservation): string {
  return `${observation.source_kind}:${observation.source_record_id}`;
}

export function selectCurrentMedicineObservations(
  observations: VersionedObservation[],
  snapshots: ReferenceSnapshotRow[],
): MedicinePriceObservation[] {
  const snapshotById = new Map(snapshots.map((snapshot) => [snapshot.id, snapshot]));
  const selected = new Map<string, { observation: VersionedObservation; retrievedAt: number }>();

  for (const observation of observations) {
    const snapshot = observation.snapshot_id ? snapshotById.get(observation.snapshot_id) : null;
    if (observation.snapshot_id && (!snapshot || snapshot.status !== "accepted")) continue;

    const retrievedAt = snapshot ? Date.parse(snapshot.retrieved_at) : Date.parse(observation.observed_at);
    const candidate = { observation, retrievedAt: Number.isFinite(retrievedAt) ? retrievedAt : 0 };
    const key = observationKey(observation);
    const current = selected.get(key);
    if (!current || candidate.retrievedAt >= current.retrievedAt) selected.set(key, candidate);
  }

  return [...selected.values()]
    .sort((a, b) => observationKey(a.observation).localeCompare(observationKey(b.observation)))
    .map(({ observation }) => observation);
}
