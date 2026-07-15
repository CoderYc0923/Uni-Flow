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

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export class InMemoryContextManager implements ContextManager {
  private workingMemory = new Map<string, Message[]>();
  private sessionMemory = new Map<string, { unitId: UnitId; summary: string }[]>();
  private vectorStore: MemoryEntry[] = [];

  async assemble(unitId: UnitId, policy: ContextPolicy, runId: string): Promise<AssembledContext> {
    const messages: Message[] = [];
    const workingKey = `${runId}:${unitId}`;
    const working = this.workingMemory.get(workingKey) ?? [];
    messages.push(...working.slice(-policy.workingMemory.maxMessages));

    const session = this.sessionMemory.get(runId) ?? [];
    for (const entry of session) {
      if (policy.sessionMemory.include.length === 0 || policy.sessionMemory.include.includes(entry.unitId)) {
        messages.push({ role: 'assistant', content: `[${entry.unitId}]: ${entry.summary}` });
      }
    }

    let retrievedDocs: MemoryEntry[] = [];
    if (policy.vectorMemory.enabled) {
      retrievedDocs = await this.search('', {
        topK: policy.vectorMemory.topK,
        minScore: policy.vectorMemory.minScore,
        collections: policy.vectorMemory.collections,
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
      messages.splice(0, this.compactMessages(messages, policy.compaction, maxTokens));
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
    const minScore = options.minScore ?? 0;
    if (!query) {
      return this.vectorStore.slice(0, topK);
    }
    return this.vectorStore
      .map((entry) => ({
        ...entry,
        score: this.simpleSimilarity(query, entry.content),
      }))
      .filter((e) => (e.score ?? 0) >= minScore)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, topK);
  }

  async compact(unitId: UnitId, strategy: CompactionStrategy): Promise<void> {
    for (const [key] of this.workingMemory) {
      if (key.endsWith(`:${unitId}`)) {
        const messages = this.workingMemory.get(key) ?? [];
        if (strategy.type === 'sliding-window') {
          const maxMessages = Math.floor(strategy.maxTokens / 100);
          this.workingMemory.set(key, messages.slice(-maxMessages));
        } else if (strategy.type === 'importance-rank') {
          this.workingMemory.set(key, messages.slice(-strategy.keepRecent));
        }
      }
    }
  }

  addVectorEntry(entry: MemoryEntry): void {
    this.vectorStore.push(entry);
  }

  private compactMessages(messages: Message[], strategy: CompactionStrategy, maxTokens: number): number {
    if (strategy.type === 'importance-rank') {
      return Math.max(0, messages.length - strategy.keepRecent);
    }
    let removeCount = 0;
    let tokens = messages.reduce((s, m) => s + estimateTokens(m.content), 0);
    while (tokens > maxTokens && removeCount < messages.length - 1) {
      tokens -= estimateTokens(messages[removeCount]!.content);
      removeCount++;
    }
    return removeCount;
  }

  private simpleSimilarity(a: string, b: string): number {
    const wordsA = new Set(a.toLowerCase().split(/\s+/));
    const wordsB = new Set(b.toLowerCase().split(/\s+/));
    let intersection = 0;
    for (const w of wordsA) {
      if (wordsB.has(w)) intersection++;
    }
    return intersection / Math.max(wordsA.size, wordsB.size, 1);
  }
}

export function createContextManager(): InMemoryContextManager {
  return new InMemoryContextManager();
}
