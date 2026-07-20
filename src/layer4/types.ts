import type { AgentInput, AgentOutput, TokenUsage, UnitId } from '../core/types.js';

/** 组装进上下文窗口的单条对话消息。 */
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/** 检索/向量记忆中的一条条目（含可选相似度分）。 */
export interface MemoryEntry {
  id: string;
  content: string;
  score?: number;
  metadata?: Record<string, unknown>;
}

/** 上下文压缩策略：滑动窗口 / 摘要 / 重要性排序。 */
export type CompactionStrategy =
  | { type: 'sliding-window'; maxTokens: number }
  | { type: 'summarize'; model: string; threshold: number }
  | { type: 'importance-rank'; maxTokens: number; keepRecent: number };

/** Unit 侧上下文策略：工作/会话/长期/向量记忆与压缩方式。 */
export interface ContextPolicy {
  workingMemory: { maxMessages: number };
  sessionMemory: { include: UnitId[]; maxTokens: number };
  longTermMemory: { enabled: boolean; scopes: string[] };
  vectorMemory: { enabled: boolean; topK: number; minScore: number; collections: string[] };
  compaction: CompactionStrategy;
}

/** `ContextManager.assemble` 的结果：消息、检索文档与 token 统计。 */
export interface AssembledContext {
  messages: Message[];
  retrievedDocs: MemoryEntry[];
  tokenCount: number;
  truncated: boolean;
}

/** 记忆/向量检索选项（topK、阈值、集合与 scope）。 */
export interface SearchOptions {
  topK?: number;
  minScore?: number;
  collections?: string[];
  scope?: string;
}

/**
 * 上下文管理器：为 Unit 组装提示上下文、记录回合、检索与压缩。
 * 默认实现见 {@link InMemoryContextManager} / {@link EnhancedContextManager}。
 */
export interface ContextManager {
  assemble(unitId: UnitId, policy: ContextPolicy, runId: string): Promise<AssembledContext>;
  record(unitId: UnitId, input: AgentInput, output: AgentOutput, runId: string): Promise<void>;
  search(query: string, options: SearchOptions): Promise<MemoryEntry[]>;
  compact(unitId: UnitId, strategy: CompactionStrategy): Promise<void>;
}

/** 检查点列表项的元信息（id / run / 时间戳）。 */
export interface SnapshotMeta {
  snapshotId: string;
  runId: string;
  timestamp: number;
}

/** 挂起中的人工审核（HITL）请求摘要。 */
export interface HITLRequest {
  unitId: UnitId;
  action: string;
  payload: unknown;
}

/** 可持久化的工作流快照（SharedState、游标、消息历史与可选 HITL）。 */
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

/**
 * 检查点存储：保存/加载/列出/删除 run 快照，供 `engine.resume` 使用。
 */
export interface CheckpointStore {
  save(runId: string, snapshot: WorkflowSnapshot): Promise<string>;
  load(runId: string, snapshotId?: string): Promise<WorkflowSnapshot | null>;
  list(runId: string): Promise<SnapshotMeta[]>;
  delete(runId: string): Promise<void>;
}

/** 日志级别。 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** 一次 span 的上下文（id、trace、名称与属性）。 */
export interface SpanContext {
  spanId: string;
  traceId: string;
  name: string;
  parentSpanId?: string;
  startTime: number;
  attributes: Record<string, string>;
}

/** Span 结束状态。 */
export type SpanStatus = 'ok' | 'error' | 'cancelled';

/**
 * 可观测性接口：span、指标、日志与 token/费用累计。
 * 默认内存实现见 {@link InMemoryObservability}。
 */
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

/** 策略引擎配置：重试、超时、熔断、预算、并发与限流。 */
export interface PolicyConfig {
  retry: { maxAttempts: number; backoff: 'fixed' | 'exponential'; baseMs: number };
  timeout: { unitMs: number; workflowMs: number };
  circuitBreaker: { failureThreshold: number; resetMs: number };
  budget: { maxTokens: number; maxCost: number };
  concurrency: { maxParallelUnits: number };
  rateLimit: { maxRequestsPerMinute: number };
}

/** 策略判定时的运行上下文（attempt、用量、耗时等）。 */
export interface PolicyContext {
  runId: string;
  unitId: UnitId;
  attempt: number;
  totalTokens: number;
  totalCost: number;
  startTime: number;
  error?: Error;
}

/** 策略引擎决策：继续 / 重试 / 跳过 / 中止 / 暂停。 */
export type PolicyDecision =
  | { action: 'proceed' }
  | { action: 'retry'; delayMs: number }
  | { action: 'skip' }
  | { action: 'abort'; reason: string }
  | { action: 'pause'; reason: string };

/**
 * 策略引擎：Unit 执行前后的预算、超时、熔断与限流判定。
 */
export interface PolicyEngine {
  preCheck(ctx: PolicyContext): PolicyDecision;
  onError(error: Error, ctx: PolicyContext): PolicyDecision;
  onComplete(result: AgentOutput, ctx: PolicyContext): void;
  recordFailure(): void;
  isCircuitOpen(): boolean;
  resetCircuit(): void;
}

/** 调用方身份（id + roles），供安全钩子鉴权。 */
export interface CallerIdentity {
  id: string;
  roles: string[];
}

/** 安全 pre/post hook 的输入上下文。 */
export interface SecurityContext {
  caller: CallerIdentity;
  unitId: UnitId;
  tools: import('../core/types.js').Tool[];
  input: AgentInput;
  secrets: Record<string, string>;
}

/** 安全决策：放行 / 拒绝 / 要求 HITL。 */
export type SecurityDecision =
  | { action: 'allow' }
  | { action: 'deny'; reason: string }
  | { action: 'require-hitl'; hitlAction: string; payload: unknown };

/** postHook 清洗后的输出（是否做过脱敏）。 */
export interface SanitizedOutput {
  output: AgentOutput;
  redacted: boolean;
}

/**
 * 安全治理：执行前鉴权/注入检测，执行后脱敏，并保留审计日志。
 */
export interface SecurityGovernance {
  preHook(ctx: SecurityContext): SecurityDecision;
  postHook(ctx: SecurityContext, output: AgentOutput): SanitizedOutput;
  getAuditLog(): { timestamp: number; event: string; details: Record<string, unknown> }[];
}

/** 默认上下文策略（工作记忆 50 条消息，滑动窗口压缩）。 */
export const DEFAULT_CONTEXT_POLICY: ContextPolicy = {
  workingMemory: { maxMessages: 50 },
  sessionMemory: { include: [], maxTokens: 8000 },
  longTermMemory: { enabled: false, scopes: [] },
  vectorMemory: { enabled: false, topK: 5, minScore: 0.7, collections: [] },
  compaction: { type: 'sliding-window', maxTokens: 8000 },
};

/** 默认策略配置（重试/超时/熔断/预算等）。 */
export const DEFAULT_POLICY_CONFIG: PolicyConfig = {
  retry: { maxAttempts: 3, backoff: 'exponential', baseMs: 1000 },
  timeout: { unitMs: 120_000, workflowMs: 600_000 },
  circuitBreaker: { failureThreshold: 5, resetMs: 60_000 },
  budget: { maxTokens: 100_000, maxCost: 10 },
  concurrency: { maxParallelUnits: 5 },
  rateLimit: { maxRequestsPerMinute: 60 },
};
