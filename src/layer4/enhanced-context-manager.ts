import type { AgentInput, AgentOutput, UnitId } from '../core/types.js';
import type {
  AssembledContext,
  CompactionStrategy,
  ContextManager,
  ContextPolicy,
  MemoryEntry,
  Message,
  SearchOptions,
} from './types.js';
import type { VectorStore } from './vector-store.js';
import type { LongTermMemoryStore } from './long-term-memory.js';

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * {@link EnhancedContextManager} 选项：可插拔向量库与长期记忆。
 */
export interface EnhancedContextManagerOptions {
  /** 可选向量存储。 */
  vectorStore?: VectorStore;
  /** 可选长期记忆存储。 */
  longTermMemory?: LongTermMemoryStore;
  /** 默认向量 collection 名。 */
  defaultCollection?: string;
}

/**
 * 增强版 ContextManager：可挂载 VectorStore 与 LongTermMemoryStore。
 */
export class EnhancedContextManager implements ContextManager {
  private workingMemory = new Map<string, Message[]>();
  private sessionMemory = new Map<string, { unitId: UnitId; summary: string }[]>();
  private vectorStore?: VectorStore;
  private longTermMemory?: LongTermMemoryStore;
  private defaultCollection: string;
  /** Fallback local vector entries when no VectorStore is provided. */
  private localVector: MemoryEntry[] = [];

  constructor(options: EnhancedContextManagerOptions = {}) {
    this.vectorStore = options.vectorStore;
    this.longTermMemory = options.longTermMemory;
    this.defaultCollection = options.defaultCollection ?? 'default';
  }

  async assemble(unitId: UnitId, policy: ContextPolicy, runId: string): Promise<AssembledContext> {
    const messages: Message[] = [];
    const workingKey = `${runId}:${unitId}`;
    const working = this.workingMemory.get(workingKey) ?? [];
    messages.push(...working.slice(-policy.workingMemory.maxMessages));

    const session = this.sessionMemory.get(runId) ?? [];
    for (const entry of session) {
      if (
        policy.sessionMemory.include.length === 0 ||
        policy.sessionMemory.include.includes(entry.unitId)
      ) {
        messages.push({ role: 'assistant', content: `[${entry.unitId}]: ${entry.summary}` });
      }
    }

    if (policy.longTermMemory.enabled && this.longTermMemory) {
      for (const scope of policy.longTermMemory.scopes) {
        const entries = await this.longTermMemory.query(scope, 10);
        for (const e of entries) {
          messages.push({ role: 'system', content: `[ltm:${scope}] ${e.content}` });
        }
      }
    }

    let retrievedDocs: MemoryEntry[] = [];
    if (policy.vectorMemory.enabled) {
      const query = working.map((m) => m.content).join(' ').slice(0, 500);
      retrievedDocs = await this.search(query || ' ', {
        topK: policy.vectorMemory.topK,
        minScore: policy.vectorMemory.minScore,
        collections: policy.vectorMemory.collections.length
          ? policy.vectorMemory.collections
          : [this.defaultCollection],
      });
      for (const doc of retrievedDocs) {
        messages.push({ role: 'system', content: `[retrieved] ${doc.content}` });
      }
    }

    let tokenCount = messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);
    let truncated = false;
    const maxTokens =
      policy.compaction.type === 'sliding-window'
        ? policy.compaction.maxTokens
        : policy.sessionMemory.maxTokens;

    if (tokenCount > maxTokens) {
      truncated = true;
      const removeCount = this.compactCount(messages, maxTokens);
      messages.splice(0, removeCount);
      tokenCount = messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);
    }

    return { messages, retrievedDocs, tokenCount, truncated };
  }

  async record(unitId: UnitId, input: AgentInput, output: AgentOutput, runId: string): Promise<void> {
    const workingKey = `${runId}:${unitId}`;
    const working = this.workingMemory.get(workingKey) ?? [];
    working.push({ role: 'user', content: input.task });
    if (input.context) working.push({ role: 'system', content: input.context });
    working.push({ role: 'assistant', content: output.content });
    this.workingMemory.set(workingKey, working);

    const session = this.sessionMemory.get(runId) ?? [];
    session.push({ unitId, summary: output.content.slice(0, 500) });
    this.sessionMemory.set(runId, session);
  }

  async search(query: string, options: SearchOptions): Promise<MemoryEntry[]> {
    const topK = options.topK ?? 5;
    const collections = options.collections?.length ? options.collections : [this.defaultCollection];

    if (this.vectorStore) {
      const all: MemoryEntry[] = [];
      for (const collection of collections) {
        const hits = await this.vectorStore.search(collection, query, options);
        all.push(...hits);
      }
      return all
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .slice(0, topK);
    }

    return this.localVector
      .map((entry) => ({
        ...entry,
        score: bagSimilarity(query, entry.content),
      }))
      .filter((e) => (e.score ?? 0) >= (options.minScore ?? 0))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, topK);
  }

  async compact(unitId: UnitId, strategy: CompactionStrategy): Promise<void> {
    for (const [key] of this.workingMemory) {
      if (!key.endsWith(`:${unitId}`)) continue;
      const messages = this.workingMemory.get(key) ?? [];
      if (strategy.type === 'sliding-window') {
        this.workingMemory.set(key, messages.slice(-Math.floor(strategy.maxTokens / 100)));
      } else if (strategy.type === 'importance-rank') {
        this.workingMemory.set(key, messages.slice(-strategy.keepRecent));
      }
    }
  }

  async addVectorEntry(entry: MemoryEntry, collection?: string): Promise<void> {
    if (this.vectorStore) {
      await this.vectorStore.upsert(collection ?? this.defaultCollection, [entry]);
    } else {
      this.localVector.push(entry);
    }
  }

  async rememberLongTerm(
    id: string,
    scope: string,
    content: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    if (!this.longTermMemory) return;
    await this.longTermMemory.put({ id, scope, content, metadata });
  }

  private compactCount(messages: Message[], maxTokens: number): number {
    let removeCount = 0;
    let tokens = messages.reduce((s, m) => s + estimateTokens(m.content), 0);
    while (tokens > maxTokens && removeCount < messages.length - 1) {
      tokens -= estimateTokens(messages[removeCount]!.content);
      removeCount++;
    }
    return removeCount;
  }
}

function bagSimilarity(a: string, b: string): number {
  const wa = new Set(a.toLowerCase().split(/\s+/));
  const wb = new Set(b.toLowerCase().split(/\s+/));
  let n = 0;
  for (const w of wa) if (wb.has(w)) n++;
  return n / Math.max(wa.size, wb.size, 1);
}

/**
 * 创建 {@link EnhancedContextManager}。
 *
 * @param options - 向量库 / 长期记忆等
 * @returns 增强上下文管理器
 */
export function createEnhancedContextManager(
  options?: EnhancedContextManagerOptions,
): EnhancedContextManager {
  return new EnhancedContextManager(options);
}
