import type { CheckpointStore, SnapshotMeta, WorkflowSnapshot } from './types.js';
import type { RedisLikeClient } from './redis-client.js';
import { InMemoryRedisClient } from './redis-client.js';

function listKey(runId: string): string {
  return `uniflow:cp:${runId}:list`;
}

function snapKey(runId: string, snapshotId: string): string {
  return `uniflow:cp:${runId}:${snapshotId}`;
}

/**
 * Redis-backed CheckpointStore. Accepts any RedisLikeClient
 * (real Redis via ioredis, or InMemoryRedisClient for local/dev).
 */
export class RedisCheckpointStore implements CheckpointStore {
  constructor(private client: RedisLikeClient = new InMemoryRedisClient()) {}

  async save(runId: string, snapshot: WorkflowSnapshot): Promise<string> {
    const snapshotId = `snap-${runId}-${snapshot.timestamp}`;
    const payload = JSON.stringify({ ...snapshot, runId });
    await this.client.set(snapKey(runId, snapshotId), payload);
    await this.client.lpush(listKey(runId), snapshotId);
    return snapshotId;
  }

  async load(runId: string, snapshotId?: string): Promise<WorkflowSnapshot | null> {
    let id = snapshotId;
    if (!id) {
      const ids = await this.client.lrange(listKey(runId), 0, 0);
      id = ids[0];
      if (!id) return null;
    }
    const raw = await this.client.get(snapKey(runId, id));
    if (!raw) return null;
    return JSON.parse(raw) as WorkflowSnapshot;
  }

  async list(runId: string): Promise<SnapshotMeta[]> {
    const ids = await this.client.lrange(listKey(runId), 0, -1);
    const metas: SnapshotMeta[] = [];
    for (const snapshotId of ids) {
      const raw = await this.client.get(snapKey(runId, snapshotId));
      if (!raw) continue;
      const snap = JSON.parse(raw) as WorkflowSnapshot;
      metas.push({ snapshotId, runId, timestamp: snap.timestamp });
    }
    return metas;
  }

  async delete(runId: string): Promise<void> {
    const ids = await this.client.lrange(listKey(runId), 0, -1);
    for (const snapshotId of ids) {
      await this.client.del(snapKey(runId, snapshotId));
    }
    await this.client.del(listKey(runId));
  }
}

export function createRedisCheckpointStore(client?: RedisLikeClient): RedisCheckpointStore {
  return new RedisCheckpointStore(client);
}
