/**
 * RedisCheckpointStore 使用的最小 Redis 兼容客户端面。
 * 可用 ioredis / node-redis 适配，或测试用 {@link InMemoryRedisClient}。
 */
export interface RedisLikeClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<'OK' | null>;
  del(key: string): Promise<number>;
  lpush(key: string, ...values: string[]): Promise<number>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  llen(key: string): Promise<number>;
}

/** 进程内 Redis 替身（kv + list），供本地/单测。 */
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
 * 按 `REDIS_URL`（或入参 url）动态连接 Redis（可选依赖 ioredis）；不可用则回退内存客户端。
 *
 * @param url - Redis URL；省略时读环境变量，再无则内存
 * @returns `{ client, kind: 'redis' | 'memory' }`
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
