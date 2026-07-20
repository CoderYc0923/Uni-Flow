import type { AssembledContext, ContextPolicy, PolicyConfig } from '../layer4/types.js';

/** Unit 的稳定标识符（字符串）。 */
export type UnitId = string;
/** 取消订阅回调（由 `subscribe` 返回）。 */
export type Unsubscribe = () => void;
/** RuntimeAdapter 的框架类型标签。 */
export type AdapterType = 'pi-agent' | 'langgraph' | 'langchain' | 'langchain4j' | 'mcp' | 'http' | 'mock';

/** Unit 执行结束原因（正常停止、长度截断、工具调用、错误、取消等）。 */
export type StopReason = 'stop' | 'length' | 'toolUse' | 'error' | 'cancelled';

/** 可供 Agent 调用的工具描述。 */
export interface Tool {
  /** 工具名。 */
  name: string;
  /** 人类可读说明。 */
  description: string;
  /** JSON Schema 风格的参数定义（可选）。 */
  parameters?: Record<string, unknown>;
}

/** 一次工具调用请求。 */
export interface ToolCall {
  /** 调用 id（便于与结果关联）。 */
  id: string;
  /** 工具名。 */
  name: string;
  /** 调用参数。 */
  arguments: Record<string, unknown>;
}

/**
 * Unit / RuntimeAdapter 的标准输入契约。
 *
 * Engine 与跨项目 HTTP Unit 均使用本形状。业务旋钮放在 `params`；**勿把 secrets 写入 `params`**（密钥走安全层 / SecretRef）。
 */
export interface AgentInput {
  /** 主任务描述（必填）。 */
  task: string;
  /** 可选补充上下文文本。 */
  context?: string;
  /**
   * 业务策略信封：引擎原样透传，不做领域解释。
   * 常见键如 `mode`、`$profile`；跨 Unit 传业务旋钮用本字段。
   * **不要放 API Key、口令等 secrets。**
   */
  params?: Record<string, unknown>;
  /** 若由委托产生，记录委托方 Unit id。 */
  delegatedBy?: UnitId;
}

/**
 * Unit / RuntimeAdapter 的标准输出契约（Remote Unit HTTP 响应体同形）。
 */
export interface AgentOutput {
  /** 主文本结果。 */
  content: string;
  /** 本轮产生的工具调用（可为空数组）。 */
  toolCalls: ToolCall[];
  /** 结束原因。 */
  stopReason: StopReason;
  /** 扩展元数据（如 `route`、`delegations`、`artifacts` 透传等）。 */
  metadata: Record<string, unknown>;
  /** 可选 token / 成本统计。 */
  tokenUsage?: TokenUsage;
}

/** Token 用量与可选估算成本。 */
export interface TokenUsage {
  /** 提示侧 token。 */
  promptTokens: number;
  /** 补全侧 token。 */
  completionTokens: number;
  /** 合计 token。 */
  totalTokens: number;
  /** 估算费用（单位由调用方约定）。 */
  estimatedCost?: number;
}

/**
 * Unit 终止策略：按 stopReason、最大步数、状态谓词、委托目标或组合逻辑判定是否结束该 Unit。
 */
export type TerminationPolicy =
  | { type: 'stop-reason'; reasons: StopReason[] }
  | { type: 'max-steps'; steps: number }
  | { type: 'condition'; predicate: (state: SharedState) => boolean }
  | { type: 'delegation'; targetUnitId: UnitId }
  | { type: 'composite'; policies: TerminationPolicy[]; op: 'and' | 'or' };

/** SharedState 作用域级别。 */
export type StateScope = 'workflow' | 'unit' | 'session' | 'global';

/** 某一 scope 下的键值视图。 */
export interface ScopedStateView {
  /** 读取键。 */
  get<T>(key: string): T | undefined;
  /** 写入键。 */
  set<T>(key: string, value: T): void;
  /** 删除键。 */
  delete(key: string): void;
  /** 是否存在键。 */
  has(key: string): boolean;
}

/**
 * 工作流共享状态：Unit 间传递 `task` / `params` / `output.<id>` 等。
 * 默认实现见 {@link createSharedState}。
 */
export interface SharedState {
  /** 读取工作流 scope 下的键。 */
  get<T>(key: string): T | undefined;
  /** 写入工作流 scope 下的键。 */
  set<T>(key: string, value: T): void;
  /** 删除键。 */
  delete(key: string): void;
  /** 是否存在键。 */
  has(key: string): boolean;
  /** 导出当前快照（扁平对象）。 */
  snapshot(): Record<string, unknown>;
  /** 进入指定 scope 的视图。 */
  scope(level: StateScope): ScopedStateView;
  /** 在事务中批量变更（冲突时可能抛错，视实现而定）。 */
  transaction(fn: (tx: SharedState) => void): void;
}

/** 工作流消息总线事件联合类型。 */
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

/** 消息订阅过滤条件（各字段可选、取交集语义）。 */
export type MessageFilter = Partial<{
  type: WorkflowMessage['type'];
  sourceUnitId: UnitId;
  targetUnitId: UnitId;
  since: number;
  until: number;
}>;

/** 消息处理器。 */
export type MessageHandler = (message: WorkflowMessage) => void | Promise<void>;

/** 工作流消息总线：发布、订阅与历史查询。 */
export interface MessageBus {
  /** 异步派发消息（不阻塞调用方等待 handler）。 */
  publish(message: WorkflowMessage): void;
  /** 同步等待所有匹配 handler 完成。 */
  publishSync(message: WorkflowMessage): Promise<void>;
  /** 按过滤条件订阅；返回取消函数。 */
  subscribe(filter: MessageFilter, handler: MessageHandler): Unsubscribe;
  /** 查询历史消息。 */
  history(filter?: MessageFilter): WorkflowMessage[];
  /** 投递保证语义。 */
  readonly deliveryGuarantee: 'at-least-once' | 'exactly-once';
}

/** 密钥引用映射：逻辑名 → 解析后的密钥字符串（由安全层注入）。 */
export type SecretRefMap = Record<string, string>;

/**
 * RuntimeAdapter.execute 时的执行上下文（运行身份、组装上下文、abort、secrets）。
 */
export interface ExecutionContext {
  /** 工作流 id。 */
  workflowId: string;
  /** 本次 run id。 */
  runId: string;
  /** 当前 Unit id。 */
  unitId: UnitId;
  /** 分布式追踪 id。 */
  traceId: string;
  /** Layer4 组装后的上下文窗口。 */
  assembledContext: AssembledContext;
  /** 已解析的密钥表（勿回写到 SharedState / params）。 */
  secrets: SecretRefMap;
  /** 取消信号。 */
  abortSignal: AbortSignal;
}

/** RuntimeAdapter 生命周期事件。 */
export type RuntimeEvent =
  | { type: 'start' }
  | { type: 'end'; output: AgentOutput }
  | { type: 'error'; error: Error }
  | { type: 'token-usage'; usage: TokenUsage };

/** Runtime 事件处理器。 */
export type RuntimeEventHandler = (event: RuntimeEvent) => void;

/**
 * 运行时适配器：把 Uni-Flow Unit 接到具体框架 / HTTP / Mock。
 * 实现须提供 `execute`；`steer` / `followUp` 可为空操作。
 */
export interface RuntimeAdapter {
  /** 适配器类型标签。 */
  readonly type: AdapterType;
  /** 执行一轮并返回 {@link AgentOutput}。 */
  execute(input: AgentInput, ctx: ExecutionContext): Promise<AgentOutput>;
  /** 运行中转向（若框架支持）。 */
  steer(content: string): void;
  /** 运行中追问（若框架支持）。 */
  followUp(content: string): void;
  /** 订阅生命周期事件。 */
  subscribe(handler: RuntimeEventHandler): Unsubscribe;
  /** 请求取消。 */
  cancel(): void;
  /** 框架名称与版本，供可观测性使用。 */
  frameworkInfo(): { name: string; version: string };
}

/**
 * 工作流中的一个 Unit：id、运行时、终止策略，以及 SharedState ↔ Agent I/O 的适配器。
 */
export interface WorkflowUnit {
  /** Unit id（须在工作流内唯一）。 */
  id: UnitId;
  /** 实际执行器。 */
  runtime: RuntimeAdapter;
  /** 何时视为该 Unit 结束。 */
  terminationPolicy: TerminationPolicy;
  /** 从 SharedState（与组装上下文）构造 {@link AgentInput}。 */
  inputAdapter: (state: SharedState, context: AssembledContext) => AgentInput;
  /** 将 {@link AgentOutput} 写回 SharedState（如 `output.<id>`）。 */
  outputAdapter: (output: AgentOutput, state: SharedState) => void;
  /** 可选上下文策略覆盖。 */
  contextPolicy?: ContextPolicy;
  /** 可选策略局部覆盖。 */
  policyOverrides?: Partial<PolicyConfig>;
  /** 可选工具列表。 */
  tools?: Tool[];
}

/**
 * 并行 ControlFlow 的失败策略：`fail-fast` | `collect-errors` | `best-effort`。
 */
export type FailureStrategy = 'fail-fast' | 'collect-errors' | 'best-effort';

/** ControlFlow 可序列化游标（写入检查点）。 */
export interface ControlFlowCursor {
  /** Flow 类型名（如 `sequential`）。 */
  flowType: string;
  /** Flow 本地状态快照。 */
  state: Record<string, unknown>;
}

/**
 * 控制流拓扑：决定下一轮调度哪些 Unit、何时完成。
 * 内建实现见 Sequential / Parallel / Router / Loop / DAG / Delegation / Composite。
 */
export interface ControlFlow {
  /** Flow 类型名。 */
  readonly type: string;
  /**
   * 根据 SharedState 与已完成集合，返回本轮应调度的 Unit 列表。
   */
  next(state: SharedState, completedUnits?: Set<UnitId>): WorkflowUnit[];
  /** 整个 Flow 是否已完成。 */
  isComplete(state: SharedState): boolean;
  /** 序列化游标。 */
  serialize(): ControlFlowCursor;
  /** 从游标恢复。 */
  restore(cursor: ControlFlowCursor): void;
}

/**
 * 创建引擎所需的工作流静态配置。
 */
export interface WorkflowConfig {
  /** 工作流稳定 id。 */
  workflowId: string;
  /** Unit id → Unit。 */
  units: Map<UnitId, WorkflowUnit>;
  /** 拓扑调度器。 */
  controlFlow: ControlFlow;
  /** 可选消息总线；缺省由引擎创建。 */
  messageBus?: MessageBus;
  /** 可选 SharedState；缺省由引擎创建。 */
  sharedState?: SharedState;
}

/**
 * 一次 `run` / `resume` 结束后的结果摘要。
 */
export interface WorkflowResult {
  /** SharedState 快照（含 `output.*` 等）。 */
  state: Record<string, unknown>;
  /** 本 run 产生的消息。 */
  messages: WorkflowMessage[];
  /** 已完成的 Unit id 列表。 */
  completedUnits: UnitId[];
  /** 耗时（毫秒）。 */
  duration: number;
  /** 运行 id。 */
  runId: string;
  /** 累计 token。 */
  tokenUsage: number;
  /** 累计成本。 */
  cost: number;
}

/**
 * 工作流引擎对外 API：运行、恢复、转向、HITL、查询状态。
 * 由 {@link createWorkflowEngine} 或 {@link createEngineFromYaml} 创建。
 */
export interface WorkflowEngine {
  /**
   * 启动新运行；`input` 写入 SharedState 初始键（常见 `task` / `params` / `context`）。
   */
  run(input?: Record<string, unknown>): Promise<WorkflowResult>;
  /** 从检查点恢复。 */
  resume(runId: string, snapshotId?: string): Promise<WorkflowResult>;
  /** 向目标 Unit 发送转向内容。 */
  steer(targetUnitId: UnitId, content: string): void;
  /** 向目标 Unit 发送追问。 */
  followUp(targetUnitId: UnitId, content: string): void;
  /** 响应人工审核请求。 */
  respondToHITL(approved: boolean, responder: string): Promise<void>;
  /** 当前 SharedState。 */
  getState(): SharedState;
  /** 当前消息历史。 */
  getMessages(): WorkflowMessage[];
  /** 当前 run id。 */
  getRunId(): string;
}
