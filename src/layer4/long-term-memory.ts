export interface LongTermMemoryEntry {
  id: string;
  scope: string;
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface LongTermMemoryStore {
  put(entry: Omit<LongTermMemoryEntry, 'createdAt' | 'updatedAt'> & { createdAt?: number }): Promise<void>;
  get(id: string): Promise<LongTermMemoryEntry | null>;
  query(scope: string, limit?: number): Promise<LongTermMemoryEntry[]>;
  delete(id: string): Promise<void>;
  listAll(): Promise<LongTermMemoryEntry[]>;
}

/**
 * Persistent long-term memory (Phase 3). Default is in-memory;
 * FileLongTermMemoryStore persists JSON to disk for local durability.
 */
export class InMemoryLongTermMemoryStore implements LongTermMemoryStore {
  private entries = new Map<string, LongTermMemoryEntry>();

  async put(
    entry: Omit<LongTermMemoryEntry, 'createdAt' | 'updatedAt'> & { createdAt?: number },
  ): Promise<void> {
    const now = Date.now();
    const existing = this.entries.get(entry.id);
    this.entries.set(entry.id, {
      id: entry.id,
      scope: entry.scope,
      content: entry.content,
      metadata: entry.metadata,
      createdAt: entry.createdAt ?? existing?.createdAt ?? now,
      updatedAt: now,
    });
  }

  async get(id: string): Promise<LongTermMemoryEntry | null> {
    return this.entries.get(id) ?? null;
  }

  async query(scope: string, limit = 50): Promise<LongTermMemoryEntry[]> {
    return [...this.entries.values()]
      .filter((e) => e.scope === scope)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, limit);
  }

  async delete(id: string): Promise<void> {
    this.entries.delete(id);
  }

  async listAll(): Promise<LongTermMemoryEntry[]> {
    return [...this.entries.values()];
  }
}

export async function createFileLongTermMemoryStore(
  filePath: string,
): Promise<LongTermMemoryStore> {
  const { readFile, writeFile, mkdir } = await import('node:fs/promises');
  const { dirname } = await import('node:path');
  const store = new InMemoryLongTermMemoryStore();

  try {
    const raw = await readFile(filePath, 'utf8');
    const data = JSON.parse(raw) as LongTermMemoryEntry[];
    for (const entry of data) {
      await store.put(entry);
    }
  } catch {
    // cold start
  }

  const flush = async (): Promise<void> => {
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(await store.listAll(), null, 2), 'utf8');
  };

  return {
    async put(entry) {
      await store.put(entry);
      await flush();
    },
    get: (id) => store.get(id),
    query: (scope, limit) => store.query(scope, limit),
    async delete(id) {
      await store.delete(id);
      await flush();
    },
    listAll: () => store.listAll(),
  };
}

export function createLongTermMemoryStore(): LongTermMemoryStore {
  return new InMemoryLongTermMemoryStore();
}
