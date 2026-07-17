import type { AssembledContext, ContextPolicy, PolicyConfig } from '../layer4/types.js';

export type UnitId = string;
export type Unsubscribe = () => void;
export type AdapterType = 'pi-agent' | 'langgraph' | 'langchain' | 'langchain4j' | 'mcp' | 'http' | 'mock';

export type StopReason = 'stop' | 'length' | 'toolUse' | 'error' | 'cancelled';

export interface Tool {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface AgentInput {
  task: string;
  context?: string;
  /** Business strategy envelope; Engine passes through without domain interpretation. */
  params?: Record<string, unknown>;
  delegatedBy?: UnitId;
}

export interface AgentOutput {
  content: string;
  toolCalls: ToolCall[];
  stopReason: StopReason;
  metadata: Record<string, unknown>;
  tokenUsage?: TokenUsage;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost?: number;
}

export type TerminationPolicy =
  | { type: 'stop-reason'; reasons: StopReason[] }
  | { type: 'max-steps'; steps: number }
  | { type: 'condition'; predicate: (state: SharedState) => boolean }
  | { type: 'delegation'; targetUnitId: UnitId }
  | { type: 'composite'; policies: TerminationPolicy[]; op: 'and' | 'or' };

export type StateScope = 'workflow' | 'unit' | 'session' | 'global';

export interface ScopedStateView {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  delete(key: string): void;
  has(key: string): boolean;
}

export interface SharedState {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  delete(key: string): void;
  has(key: string): boolean;
  snapshot(): Record<string, unknown>;
  scope(level: StateScope): ScopedStateView;
  transaction(fn: (tx: SharedState) => void): void;
}

export type WorkflowMessage =
  | { type: 'unit-output'; sourceUnitId: UnitId; data: AgentOutput; timestamp: number }
  | { type: 'delegation'; sourceUnitId: UnitId; targetUnitId: UnitId; task: string; timestamp: number }
  | { type: 'steering'; targetUnitId: UnitId; content: string; timestamp: number }
  | { type: 'followup'; targetUnitId: UnitId; content: string; timestamp: number }
  | { type: 'broadcast'; sourceUnitId: UnitId; content: string; timestamp: number }
  | { type: 'state-update'; key: string; value: unknown; timestamp: number }
  | { type: 'checkpoint'; runId: string; snapshotId: string; timestamp: number }
  | { type: 'policy-violation'; unitId: UnitId; violation: string; timestamp: number }
  | { type: 'hitl-request'; unitId: UnitId; action: string; payload: unknown; timestamp: number }
  | { type: 'hitl-response'; approved: boolean; responder: string; timestamp: number }
  | { type: 'cost-update'; unitId: UnitId; tokens: number; cost: number; timestamp: number };

export type MessageFilter = Partial<{
  type: WorkflowMessage['type'];
  sourceUnitId: UnitId;
  targetUnitId: UnitId;
  since: number;
  until: number;
}>;

export type MessageHandler = (message: WorkflowMessage) => void | Promise<void>;

export interface MessageBus {
  publish(message: WorkflowMessage): void;
  publishSync(message: WorkflowMessage): Promise<void>;
  subscribe(filter: MessageFilter, handler: MessageHandler): Unsubscribe;
  history(filter?: MessageFilter): WorkflowMessage[];
  readonly deliveryGuarantee: 'at-least-once' | 'exactly-once';
}

export type SecretRefMap = Record<string, string>;

export interface ExecutionContext {
  workflowId: string;
  runId: string;
  unitId: UnitId;
  traceId: string;
  assembledContext: AssembledContext;
  secrets: SecretRefMap;
  abortSignal: AbortSignal;
}

export type RuntimeEvent =
  | { type: 'start' }
  | { type: 'end'; output: AgentOutput }
  | { type: 'error'; error: Error }
  | { type: 'token-usage'; usage: TokenUsage };

export type RuntimeEventHandler = (event: RuntimeEvent) => void;

export interface RuntimeAdapter {
  readonly type: AdapterType;
  execute(input: AgentInput, ctx: ExecutionContext): Promise<AgentOutput>;
  steer(content: string): void;
  followUp(content: string): void;
  subscribe(handler: RuntimeEventHandler): Unsubscribe;
  cancel(): void;
  frameworkInfo(): { name: string; version: string };
}

export interface WorkflowUnit {
  id: UnitId;
  runtime: RuntimeAdapter;
  terminationPolicy: TerminationPolicy;
  inputAdapter: (state: SharedState, context: AssembledContext) => AgentInput;
  outputAdapter: (output: AgentOutput, state: SharedState) => void;
  contextPolicy?: ContextPolicy;
  policyOverrides?: Partial<PolicyConfig>;
  tools?: Tool[];
}

export type FailureStrategy = 'fail-fast' | 'collect-errors' | 'best-effort';

export interface ControlFlowCursor {
  flowType: string;
  state: Record<string, unknown>;
}

export interface ControlFlow {
  readonly type: string;
  next(state: SharedState, completedUnits?: Set<UnitId>): WorkflowUnit[];
  isComplete(state: SharedState): boolean;
  serialize(): ControlFlowCursor;
  restore(cursor: ControlFlowCursor): void;
}

export interface WorkflowConfig {
  workflowId: string;
  units: Map<UnitId, WorkflowUnit>;
  controlFlow: ControlFlow;
  messageBus?: MessageBus;
  sharedState?: SharedState;
}

export interface WorkflowResult {
  state: Record<string, unknown>;
  messages: WorkflowMessage[];
  completedUnits: UnitId[];
  duration: number;
  runId: string;
  tokenUsage: number;
  cost: number;
}

export interface WorkflowEngine {
  run(input?: Record<string, unknown>): Promise<WorkflowResult>;
  resume(runId: string, snapshotId?: string): Promise<WorkflowResult>;
  steer(targetUnitId: UnitId, content: string): void;
  followUp(targetUnitId: UnitId, content: string): void;
  respondToHITL(approved: boolean, responder: string): Promise<void>;
  getState(): SharedState;
  getMessages(): WorkflowMessage[];
  getRunId(): string;
}
