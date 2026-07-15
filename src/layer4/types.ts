import type { AgentInput, AgentOutput, TokenUsage, UnitId } from '../core/types.js';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface MemoryEntry {
  id: string;
  content: string;
  score?: number;
  metadata?: Record<string, unknown>;
}

export type CompactionStrategy =
  | { type: 'sliding-window'; maxTokens: number }
  | { type: 'summarize'; model: string; threshold: number }
  | { type: 'importance-rank'; maxTokens: number; keepRecent: number };

export interface ContextPolicy {
  workingMemory: { maxMessages: number };
  sessionMemory: { include: UnitId[]; maxTokens: number };
  longTermMemory: { enabled: boolean; scopes: string[] };
  vectorMemory: { enabled: boolean; topK: number; minScore: number; collections: string[] };
  compaction: CompactionStrategy;
}

export interface AssembledContext {
  messages: Message[];
  retrievedDocs: MemoryEntry[];
  tokenCount: number;
  truncated: boolean;
}

export interface SearchOptions {
  topK?: number;
  minScore?: number;
  collections?: string[];
  scope?: string;
}

export interface ContextManager {
  assemble(unitId: UnitId, policy: ContextPolicy, runId: string): Promise<AssembledContext>;
  record(unitId: UnitId, input: AgentInput, output: AgentOutput, runId: string): Promise<void>;
  search(query: string, options: SearchOptions): Promise<MemoryEntry[]>;
  compact(unitId: UnitId, strategy: CompactionStrategy): Promise<void>;
}

export interface SnapshotMeta {
  snapshotId: string;
  runId: string;
  timestamp: number;
}

export interface HITLRequest {
  unitId: UnitId;
  action: string;
  payload: unknown;
}

export interface WorkflowSnapshot {
  runId: string;
  workflowId: string;
  timestamp: number;
  sharedState: Record<string, unknown>;
  controlFlowCursor: import('../core/types.js').ControlFlowCursor;
  completedUnits: UnitId[];
  messageBusHistory: import('../core/types.js').WorkflowMessage[];
  pendingHITL?: HITLRequest;
  metadata: { duration: number; cost: number; tokenUsage: number };
}

export interface CheckpointStore {
  save(runId: string, snapshot: WorkflowSnapshot): Promise<string>;
  load(runId: string, snapshotId?: string): Promise<WorkflowSnapshot | null>;
  list(runId: string): Promise<SnapshotMeta[]>;
  delete(runId: string): Promise<void>;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface SpanContext {
  spanId: string;
  traceId: string;
  name: string;
  parentSpanId?: string;
  startTime: number;
  attributes: Record<string, string>;
}

export type SpanStatus = 'ok' | 'error' | 'cancelled';

export interface Observability {
  startSpan(name: string, parent?: SpanContext): SpanContext;
  endSpan(ctx: SpanContext, status: SpanStatus): void;
  recordMetric(name: string, value: number, tags?: Record<string, string>): void;
  log(level: LogLevel, message: string, fields?: Record<string, unknown>): void;
  recordCost(unitId: UnitId, usage: TokenUsage): void;
  getSpans(): SpanContext[];
  getMetrics(): { name: string; value: number; tags: Record<string, string> }[];
  getLogs(): { level: LogLevel; message: string; fields: Record<string, unknown>; timestamp: number }[];
  getTotalCost(): number;
  getTotalTokens(): number;
}

export interface PolicyConfig {
  retry: { maxAttempts: number; backoff: 'fixed' | 'exponential'; baseMs: number };
  timeout: { unitMs: number; workflowMs: number };
  circuitBreaker: { failureThreshold: number; resetMs: number };
  budget: { maxTokens: number; maxCost: number };
  concurrency: { maxParallelUnits: number };
  rateLimit: { maxRequestsPerMinute: number };
}

export interface PolicyContext {
  runId: string;
  unitId: UnitId;
  attempt: number;
  totalTokens: number;
  totalCost: number;
  startTime: number;
  error?: Error;
}

export type PolicyDecision =
  | { action: 'proceed' }
  | { action: 'retry'; delayMs: number }
  | { action: 'skip' }
  | { action: 'abort'; reason: string }
  | { action: 'pause'; reason: string };

export interface PolicyEngine {
  preCheck(ctx: PolicyContext): PolicyDecision;
  onError(error: Error, ctx: PolicyContext): PolicyDecision;
  onComplete(result: AgentOutput, ctx: PolicyContext): void;
  recordFailure(): void;
  isCircuitOpen(): boolean;
  resetCircuit(): void;
}

export interface CallerIdentity {
  id: string;
  roles: string[];
}

export interface SecurityContext {
  caller: CallerIdentity;
  unitId: UnitId;
  tools: import('../core/types.js').Tool[];
  input: AgentInput;
  secrets: Record<string, string>;
}

export type SecurityDecision =
  | { action: 'allow' }
  | { action: 'deny'; reason: string }
  | { action: 'require-hitl'; hitlAction: string; payload: unknown };

export interface SanitizedOutput {
  output: AgentOutput;
  redacted: boolean;
}

export interface SecurityGovernance {
  preHook(ctx: SecurityContext): SecurityDecision;
  postHook(ctx: SecurityContext, output: AgentOutput): SanitizedOutput;
  getAuditLog(): { timestamp: number; event: string; details: Record<string, unknown> }[];
}

export const DEFAULT_CONTEXT_POLICY: ContextPolicy = {
  workingMemory: { maxMessages: 50 },
  sessionMemory: { include: [], maxTokens: 8000 },
  longTermMemory: { enabled: false, scopes: [] },
  vectorMemory: { enabled: false, topK: 5, minScore: 0.7, collections: [] },
  compaction: { type: 'sliding-window', maxTokens: 8000 },
};

export const DEFAULT_POLICY_CONFIG: PolicyConfig = {
  retry: { maxAttempts: 3, backoff: 'exponential', baseMs: 1000 },
  timeout: { unitMs: 120_000, workflowMs: 600_000 },
  circuitBreaker: { failureThreshold: 5, resetMs: 60_000 },
  budget: { maxTokens: 100_000, maxCost: 10 },
  concurrency: { maxParallelUnits: 5 },
  rateLimit: { maxRequestsPerMinute: 60 },
};
