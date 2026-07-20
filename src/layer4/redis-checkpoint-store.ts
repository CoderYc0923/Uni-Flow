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
 * 基于 Redis（或兼容客户端）的 CheckpointStore。
 * 可注入真实 Redis，或本地用 {@link InMemoryRedisClient}。
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

/**
 * 创建 {@link RedisCheckpointStore}。
 *
 * @param client - Redis 兼容客户端；默认内存客户端
 * @returns 检查点存储
 */
export function createRedisCheckpointStore(client?: RedisLikeClient): RedisCheckpointStore {
  return new RedisCheckpointStore(client);
}
