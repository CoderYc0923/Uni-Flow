import type { MemoryEntry, SearchOptions } from './types.js';

export interface VectorStore {
  upsert(collection: string, entries: MemoryEntry[]): Promise<void>;
  search(collection: string, query: string, options?: SearchOptions): Promise<MemoryEntry[]>;
  delete(collection: string, ids: string[]): Promise<void>;
}

/**
 * In-memory vector store with bag-of-words similarity.
 * Production: swap for PgVectorStore or QdrantStore implementing the same interface.
 */
export class InMemoryVectorStore implements VectorStore {
  private collections = new Map<string, MemoryEntry[]>();

  async upsert(collection: string, entries: MemoryEntry[]): Promise<void> {
    const list = this.collections.get(collection) ?? [];
    for (const entry of entries) {
      const idx = list.findIndex((e) => e.id === entry.id);
      if (idx >= 0) list[idx] = entry;
      else list.push(entry);
    }
    this.collections.set(collection, list);
  }

  async search(collection: string, query: string, options: SearchOptions = {}): Promise<MemoryEntry[]> {
    const list = this.collections.get(collection) ?? [];
    const topK = options.topK ?? 5;
    const minScore = options.minScore ?? 0;
    return list
      .map((entry) => ({
        ...entry,
        score: similarity(query, entry.content),
      }))
      .filter((e) => (e.score ?? 0) >= minScore)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, topK);
  }

  async delete(collection: string, ids: string[]): Promise<void> {
    const list = this.collections.get(collection) ?? [];
    const idSet = new Set(ids);
    this.collections.set(
      collection,
      list.filter((e) => !idSet.has(e.id)),
    );
  }
}

/**
 * Pgvector-oriented interface adapter.
 * Embeds content via optional embedFn, stores vectors as float arrays in memory
 * simulating a pgvector table (Phase 3 interface; wire to real pg later).
 */
export interface PgVectorConfig {
  /** Optional embedding function. Defaults to hash-bag embedding. */
  embedFn?: (text: string) => Promise<number[]>;
  dimensions?: number;
}

export class PgVectorStore implements VectorStore {
  private tables = new Map<string, { entry: MemoryEntry; embedding: number[] }[]>();
  private embedFn: (text: string) => Promise<number[]>;
  private dimensions: number;

  constructor(config: PgVectorConfig = {}) {
    this.dimensions = config.dimensions ?? 64;
    this.embedFn = config.embedFn ?? ((text) => Promise.resolve(hashEmbed(text, this.dimensions)));
  }

  async upsert(collection: string, entries: MemoryEntry[]): Promise<void> {
    const rows = this.tables.get(collection) ?? [];
    for (const entry of entries) {
      const embedding = await this.embedFn(entry.content);
      const idx = rows.findIndex((r) => r.entry.id === entry.id);
      if (idx >= 0) rows[idx] = { entry, embedding };
      else rows.push({ entry, embedding });
    }
    this.tables.set(collection, rows);
  }

  async search(collection: string, query: string, options: SearchOptions = {}): Promise<MemoryEntry[]> {
    const rows = this.tables.get(collection) ?? [];
    const qEmb = await this.embedFn(query);
    const topK = options.topK ?? 5;
    const minScore = options.minScore ?? 0;
    return rows
      .map(({ entry, embedding }) => ({
        ...entry,
        score: cosine(qEmb, embedding),
      }))
      .filter((e) => (e.score ?? 0) >= minScore)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, topK);
  }

  async delete(collection: string, ids: string[]): Promise<void> {
    const rows = this.tables.get(collection) ?? [];
    const idSet = new Set(ids);
    this.tables.set(
      collection,
      rows.filter((r) => !idSet.has(r.entry.id)),
    );
  }
}

function similarity(a: string, b: string): number {
  const wa = new Set(a.toLowerCase().split(/\s+/));
  const wb = new Set(b.toLowerCase().split(/\s+/));
  let n = 0;
  for (const w of wa) if (wb.has(w)) n++;
  return n / Math.max(wa.size, wb.size, 1);
}

function hashEmbed(text: string, dim: number): number[] {
  const vec = new Array(dim).fill(0) as number[];
  const words = text.toLowerCase().split(/\s+/);
  for (const w of words) {
    let h = 0;
    for (let i = 0; i < w.length; i++) h = (h * 31 + w.charCodeAt(i)) >>> 0;
    vec[h % dim]! += 1;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

export function createVectorStore(kind: 'memory' | 'pgvector' = 'memory', config?: PgVectorConfig): VectorStore {
  return kind === 'pgvector' ? new PgVectorStore(config) : new InMemoryVectorStore();
}
