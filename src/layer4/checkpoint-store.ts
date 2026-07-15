import type { CheckpointStore, SnapshotMeta, WorkflowSnapshot } from './types.js';

export class InMemoryCheckpointStore implements CheckpointStore {
  private snapshots = new Map<string, WorkflowSnapshot[]>();

  async save(runId: string, snapshot: WorkflowSnapshot): Promise<string> {
    const snapshotId = `snap-${runId}-${snapshot.timestamp}`;
    const list = this.snapshots.get(runId) ?? [];
    list.push({ ...snapshot, runId });
    this.snapshots.set(runId, list);
    return snapshotId;
  }

  async load(runId: string, snapshotId?: string): Promise<WorkflowSnapshot | null> {
    const list = this.snapshots.get(runId);
    if (!list || list.length === 0) return null;
    if (snapshotId) {
      const idx = list.findIndex((s) => `snap-${runId}-${s.timestamp}` === snapshotId);
      return idx >= 0 ? list[idx]! : null;
    }
    return list[list.length - 1]!;
  }

  async list(runId: string): Promise<SnapshotMeta[]> {
    const list = this.snapshots.get(runId) ?? [];
    return list.map((s) => ({
      snapshotId: `snap-${runId}-${s.timestamp}`,
      runId,
      timestamp: s.timestamp,
    }));
  }

  async delete(runId: string): Promise<void> {
    this.snapshots.delete(runId);
  }
}

export function createCheckpointStore(): CheckpointStore {
  return new InMemoryCheckpointStore();
}
