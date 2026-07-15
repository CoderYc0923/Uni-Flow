/**
 * Minimal Redis-compatible client surface used by RedisCheckpointStore.
 * Works with ioredis / node-redis via adapter, or InMemoryRedisClient for tests.
 */
export interface RedisLikeClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<'OK' | null>;
  del(key: string): Promise<number>;
  lpush(key: string, ...values: string[]): Promise<number>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  llen(key: string): Promise<number>;
}

export class InMemoryRedisClient implements RedisLikeClient {
  private kv = new Map<string, string>();
  private lists = new Map<string, string[]>();

  async get(key: string): Promise<string | null> {
    return this.kv.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<'OK'> {
    this.kv.set(key, value);
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const had = this.kv.delete(key) || this.lists.delete(key);
    return had ? 1 : 0;
  }

  async lpush(key: string, ...values: string[]): Promise<number> {
    const list = this.lists.get(key) ?? [];
    list.unshift(...values);
    this.lists.set(key, list);
    return list.length;
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const list = this.lists.get(key) ?? [];
    const end = stop < 0 ? list.length + stop + 1 : stop + 1;
    return list.slice(start, end);
  }

  async llen(key: string): Promise<number> {
    return (this.lists.get(key) ?? []).length;
  }
}

/**
 * Dynamically connect to Redis via REDIS_URL using ioredis if available.
 * Falls back to InMemoryRedisClient when unavailable.
 */
export async function createRedisClient(
  url?: string,
): Promise<{ client: RedisLikeClient; kind: 'redis' | 'memory' }> {
  const redisUrl = url ?? process.env.REDIS_URL;
  if (!redisUrl) {
    return { client: new InMemoryRedisClient(), kind: 'memory' };
  }

  try {
    // Optional peer dependency — avoid hard import so package installs without redis.
    const mod = await import('ioredis' as string);
    const Redis = (mod as { default: new (url: string) => RedisLikeClient }).default;
    const client = new Redis(redisUrl);
    return { client, kind: 'redis' };
  } catch {
    return { client: new InMemoryRedisClient(), kind: 'memory' };
  }
}
