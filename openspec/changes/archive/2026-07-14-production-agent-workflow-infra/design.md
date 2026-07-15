## Context

现有《Agent 统一工作流模式设计》定义了三层抽象：

- **Layer 1** WorkflowUnit — 原子 Agent 单元（绑定 pi-agent-core）
- **Layer 2** ControlFlow — 编排策略（Sequential/Parallel/Router/DAG/Loop/Delegation/Composite）
- **Layer 3** MessageBus + SharedState — 通信与状态

该模型在编排逻辑上自洽，但面向生产环境时缺少横切基础设施，且与具体语言/框架强绑定。目标用户场景：

- 跨语言业务项目（Node/Java/Python）
- 使用 Cursor/Codex 开发 Agent 单元
- 已有项目可能接入 LangGraph/LangChain/LangChain4j，要求零侵入或低侵入接入
- 采用混合架构（C）：核心编排服务 + 各语言 SDK + MCP/Adapter 桥接

## Goals / Non-Goals

**Goals:**

- 在现有三层之上新增 Layer 4 Infrastructure Plane，覆盖上下文、持久化、可观测、容错、安全
- 通过 RuntimeAdapter 解耦 WorkflowUnit 与具体 Agent 运行时
- 提供 Framework Bridge，支持 Sidecar 注入和 Unit Wrapper 两种零/低侵入模式
- 定义跨语言 SDK 契约，分三阶段落地（TS 参考实现 → 编排服务 → 多语言 SDK）
- 保持现有 ControlFlow 组合语义与五个不变量不变

**Non-Goals:**

- 不替代 LangGraph/LangChain 的内部编排逻辑（除非用户主动选择模式 C 全量编排）
- 不做多租户 SaaS 平台（首期）
- 不实现具体向量数据库或 Redis 的开源替代品（通过接口抽象，可插拔）
- 不定义 UI/管理控制台

---

## 四层架构总览

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Layer 4: Infrastructure Plane                                           │
│  ┌────────────┬─────────────┬──────────────┬────────────┬──────────────┐ │
│  │ContextMgr  │Checkpoint   │Observability │PolicyEngine│Security      │ │
│  │            │Store        │              │            │Governance    │ │
│  └────────────┴─────────────┴──────────────┴────────────┴──────────────┘ │
├──────────────────────────────────────────────────────────────────────────┤
│  Layer 3: MessageBus + SharedState（增强）                                 │
├──────────────────────────────────────────────────────────────────────────┤
│  Layer 2: ControlFlow（不变，增加 Checkpoint/HITL 感知 Hook）              │
├──────────────────────────────────────────────────────────────────────────┤
│  Layer 1: WorkflowUnit + RuntimeAdapter（解耦 pi-agent-core）            │
└──────────────────────────────────────────────────────────────────────────┘
```

**执行管线（Unit 单次执行的完整路径）：**

```
ControlFlow.next()
  → PolicyEngine.preCheck(budget, concurrency)
  → SecurityGovernance.preHook(auth, toolPolicy, pii, secrets)
  → ContextManager.assemble(unitId, scopes)     // 组装上下文注入 inputAdapter
  → RuntimeAdapter.execute(input, execContext)
  → SecurityGovernance.postHook(pii, audit)
  → outputAdapter → SharedState
  → ContextManager.record(unitId, input, output) // 写入记忆
  → CheckpointStore.save(snapshot)               // 持久化快照
  → Observability.emit(span, metrics, cost)
  → MessageBus.publish(unit-output)
```

---

## Layer 1: WorkflowUnit + RuntimeAdapter

### 1.1 设计变更

原 WorkflowUnit 直接持有 `AgentConfig` 并绑定 pi-agent-core。新设计中：

```typescript
interface WorkflowUnit {
  id: UnitId;
  runtime: RuntimeAdapter;              // 替代直接绑定 Agent
  terminationPolicy: TerminationPolicy;
  inputAdapter: (state: SharedState, context: AssembledContext) => AgentInput;
  outputAdapter: (output: AgentOutput, state: SharedState) => void;
  contextPolicy?: ContextPolicy;        // 该 Unit 的记忆/检索策略
  policyOverrides?: Partial<PolicyConfig>; // Unit 级策略覆盖
}
```

### 1.2 RuntimeAdapter 契约

```typescript
interface RuntimeAdapter {
  readonly type: AdapterType;
  // 'pi-agent' | 'langgraph' | 'langchain' | 'langchain4j' | 'mcp' | 'http'

  execute(input: AgentInput, ctx: ExecutionContext): Promise<AgentOutput>;
  steer(content: string): void;
  followUp(content: string): void;
  subscribe(handler: RuntimeEventHandler): Unsubscribe;
  cancel(): void;
  frameworkInfo(): { name: string; version: string };
}

interface ExecutionContext {
  workflowId: string;
  runId: string;
  unitId: UnitId;
  traceId: string;
  assembledContext: AssembledContext;
  secrets: SecretRefMap;           // 密钥引用，非明文
  abortSignal: AbortSignal;
}
```

### 1.3 Framework Bridge 三种接入模式

| 模式 | 侵入性 | 场景 | 实现 |
|------|--------|------|------|
| **A: Sidecar** | 零 | 只借基础设施 | 实现框架原生接口（LangGraph Checkpointer、LangChain Memory） |
| **B: Unit Wrapper** | 低 | 外层编排多个已有 Agent | `LangGraphAdapter(graph)` 黑盒包装 |
| **C: 全量编排** | 高 | 新项目 | 直接用 Uni-Flow ControlFlow |

**适配器矩阵：**

| 框架 | Sidecar 接口 | Wrapper Adapter | 语言 |
|------|-------------|-----------------|------|
| LangGraph | `BaseCheckpointSaver` | `LangGraphAdapter` | Python |
| LangChain | `BaseMemory` / Callbacks | `LangChainAdapter` | Python |
| LangChain4j | `ChatMemory` / `ChatMemoryStore` | `LangChain4jAdapter` | Java |
| pi-agent-core | 原生 | `PiAgentAdapter` | TypeScript |
| 任意服务 | — | `HttpAdapter` / `McpAdapter` | 任意 |

### 1.4 TerminationPolicy（不变，扩展语义）

原有五种策略保持不变。新增与 PolicyEngine 的协作：当 `max-steps` 或 `condition` 触发时，CheckpointStore 记录终止原因，Observability 标记 `termination_reason` 标签。

---

## Layer 2: ControlFlow（增强）

### 2.1 核心不变

七种控制流（Loop/Sequential/Parallel/Router/DAG/Delegation/Composite）的 `next()` / `isComplete()` 接口不变，五个不变量保持。

### 2.2 增强点

**Checkpoint 感知：** 每次 `next()` 返回前，引擎检查是否有未完成的暂停点（HITL Gate 或 PolicyEngine 熔断），通过 CheckpointStore 恢复控制流内部游标。

**HITL 中断：** ControlFlow 不直接实现 HITL，而是通过引擎层注入一个特殊 WorkflowUnit（`HITLGateUnit`），其 `TerminationPolicy` 为 `condition: state.get('hitl.approved')`。审批通过后 ControlFlow 继续。

**并行流部分失败：** ParallelFlow 增加 `failureStrategy` 配置：

```typescript
type FailureStrategy = 'fail-fast' | 'collect-errors' | 'best-effort';
```

失败 Unit 的错误写入 `SharedState.errors[]`，由 Reducer 或 PolicyEngine 决定后续行为。

**幂等调度：** `next()` 在 Checkpoint 恢复时，通过 `completedUnits` 集合跳过已完成的 Unit，避免重复执行。

---

## Layer 3: MessageBus + SharedState（增强）

### 3.1 MessageBus 增强

```typescript
interface MessageBus {
  publish(message: WorkflowMessage): void;
  subscribe(filter: MessageFilter, handler: MessageHandler): Unsubscribe;
  history(filter?: MessageFilter): WorkflowMessage[];

  // 新增
  publishSync(message: WorkflowMessage): void;  // 等待所有订阅者处理完毕
  deliveryGuarantee: 'at-least-once' | 'exactly-once';
}
```

**新增消息类型：**

```typescript
type WorkflowMessage =
  | ... // 原有 6 种
  | { type: 'checkpoint'; runId: string; snapshotId: string; timestamp: number }
  | { type: 'policy-violation'; unitId: UnitId; violation: string; timestamp: number }
  | { type: 'hitl-request'; unitId: UnitId; action: string; payload: any; timestamp: number }
  | { type: 'hitl-response'; approved: boolean; responder: string; timestamp: number }
  | { type: 'cost-update'; unitId: UnitId; tokens: number; cost: number; timestamp: number };
```

### 3.2 SharedState 增强

```typescript
interface SharedState {
  // 原有 API 不变
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  delete(key: string): void;
  has(key: string): boolean;
  snapshot(): Record<string, any>;

  // 新增：作用域隔离
  scope(level: StateScope): ScopedStateView;
  transaction(fn: (tx: SharedState) => void): void;  // 原子写入
}

type StateScope = 'workflow' | 'unit' | 'session' | 'global';
```

**作用域规则：**

| 作用域 | 生命周期 | 典型用途 |
|--------|---------|---------|
| `workflow` | 单次工作流运行 | plan、completedSteps、aggregated |
| `unit` | 单个 Unit 执行期间 | 临时推理状态 |
| `session` | 跨多次工作流运行 | 用户偏好、会话上下文 |
| `global` | 永久 | 配置、注册表 |

并行 Unit 写入同一 key 时，`transaction()` 提供乐观锁；冲突时 PolicyEngine 触发重试或失败。

---

## Layer 4: Infrastructure Plane

### 4.1 ContextManager — 上下文与记忆

#### 四层记忆模型

```
┌─────────────────────────────────────────────────────────┐
│  Working Memory（工作记忆）                                │
│  当前 Unit 的 Agent Loop 消息历史                           │
│  存储：内存 | 生命周期：Unit 执行期间                         │
├─────────────────────────────────────────────────────────┤
│  Session Memory（会话记忆）                                │
│  当前工作流运行的跨 Unit 上下文                              │
│  存储：内存 + Checkpoint | 生命周期：workflow run            │
├─────────────────────────────────────────────────────────┤
│  Long-term Memory（长期记忆）                              │
│  跨会话持久化的知识和经验                                     │
│  存储：DB（PostgreSQL/MongoDB）| 生命周期：永久               │
├─────────────────────────────────────────────────────────┤
│  Vector Memory（向量记忆）                                 │
│  语义检索的知识库                                          │
│  存储：向量 DB（pgvector/Qdrant/Milvus）| 生命周期：永久       │
└─────────────────────────────────────────────────────────┘
```

#### 核心接口

```typescript
interface ContextManager {
  assemble(unitId: UnitId, policy: ContextPolicy): Promise<AssembledContext>;
  record(unitId: UnitId, input: AgentInput, output: AgentOutput): Promise<void>;
  search(query: string, options: SearchOptions): Promise<MemoryEntry[]>;
  compact(unitId: UnitId, strategy: CompactionStrategy): Promise<void>;
}

interface ContextPolicy {
  workingMemory: { maxMessages: number };
  sessionMemory: { include: UnitId[]; maxTokens: number };
  longTermMemory: { enabled: boolean; scopes: string[] };
  vectorMemory: { enabled: boolean; topK: number; minScore: number; collections: string[] };
  compaction: CompactionStrategy;
}

interface AssembledContext {
  messages: Message[];          // 组装后的消息列表
  retrievedDocs: MemoryEntry[];   // 向量检索结果
  tokenCount: number;             // 预估 token 数
  truncated: boolean;             // 是否触发了截断/压缩
}

type CompactionStrategy =
  | { type: 'sliding-window'; maxTokens: number }
  | { type: 'summarize'; model: string; threshold: number }
  | { type: 'importance-rank'; maxTokens: number; keepRecent: number };
```

#### 上下文组装流程

```
inputAdapter 调用前：
  1. 读取 Working Memory（当前 Unit 历史消息）
  2. 读取 Session Memory（本次 run 中其他 Unit 的 output 摘要）
  3. 若 vectorMemory.enabled → 向量检索 topK 相关文档
  4. 若 longTermMemory.enabled → 按 scope 查询持久记忆
  5. Token 预算检查 → 超出则触发 CompactionStrategy
  6. 返回 AssembledContext → 注入 inputAdapter
```

#### Sidecar 模式接入

- **LangGraph**: 实现 `BaseCheckpointSaver`，内部调用 `ContextManager.record()` / `assemble()`
- **LangChain**: 实现 `BaseMemory`，读写映射到 Session/Long-term Memory
- **LangChain4j**: 实现 `ChatMemoryStore`，同样映射

### 4.2 CheckpointStore — 持久化与断点续跑

```typescript
interface CheckpointStore {
  save(runId: string, snapshot: WorkflowSnapshot): Promise<string>;
  load(runId: string, snapshotId?: string): Promise<WorkflowSnapshot | null>;
  list(runId: string): Promise<SnapshotMeta[]>;
  delete(runId: string): Promise<void>;
}

interface WorkflowSnapshot {
  runId: string;
  workflowId: string;
  timestamp: number;
  sharedState: Record<string, any>;
  controlFlowCursor: SerializedControlFlow;  // 控制流内部游标
  completedUnits: UnitId[];
  messageBusHistory: WorkflowMessage[];
  pendingHITL?: HITLRequest;
  metadata: { duration: number; cost: number; tokenUsage: number };
}
```

**触发时机：**

| 事件 | 动作 |
|------|------|
| 每个 Unit 完成后 | 自动 save |
| HITL Gate 暂停时 | save（含 pendingHITL） |
| PolicyEngine 熔断时 | save（含错误状态） |
| 用户主动 pause | save |
| 恢复时 | load → 重建 SharedState + ControlFlow 游标 → 继续 next() |

**存储后端（可插拔）：** 默认 Redis（快照 JSON），大规模用 PostgreSQL（事件溯源）。

**事件溯源（可选）：** 每次状态变更追加 Event 而非覆盖快照，支持完整回放调试。

### 4.3 Observability — 可观测性

```typescript
interface Observability {
  startSpan(name: string, parent?: SpanContext): SpanContext;
  endSpan(ctx: SpanContext, status: SpanStatus): void;
  recordMetric(name: string, value: number, tags: Record<string, string>): void;
  log(level: LogLevel, message: string, fields: Record<string, any>): void;
  recordCost(unitId: UnitId, usage: TokenUsage): void;
}
```

**三层信号：**

| 信号 | 内容 | 后端 |
|------|------|------|
| **Traces** | 工作流 → Unit → Tool Call 层级 Span | OpenTelemetry |
| **Metrics** | 延迟、成功率、Token 用量、成本、队列深度 | Prometheus |
| **Logs** | 结构化 JSON 日志，关联 traceId/runId | 任意 |

**成本计量：** 每次 LLM 调用后，`RuntimeAdapter` 通过事件上报 `TokenUsage`，Observability 累加到 run 级别，PolicyEngine 可据此熔断。

**Framework Bridge 标注：** Span 自动附加 `framework.name` / `framework.version` 标签（来自 `RuntimeAdapter.frameworkInfo()`）。

### 4.4 PolicyEngine — 容错与资源管控

```typescript
interface PolicyEngine {
  preCheck(ctx: PolicyContext): PolicyDecision;
  onError(error: Error, ctx: PolicyContext): PolicyDecision;
  onComplete(result: AgentOutput, ctx: PolicyContext): void;
}

interface PolicyConfig {
  retry: { maxAttempts: number; backoff: 'fixed' | 'exponential'; baseMs: number };
  timeout: { unitMs: number; workflowMs: number };
  circuitBreaker: { failureThreshold: number; resetMs: number };
  budget: { maxTokens: number; maxCost: number };
  concurrency: { maxParallelUnits: number };
  rateLimit: { maxRequestsPerMinute: number };
}

type PolicyDecision =
  | { action: 'proceed' }
  | { action: 'retry'; delayMs: number }
  | { action: 'skip' }
  | { action: 'abort'; reason: string }
  | { action: 'pause'; reason: string };  // 触发 HITL 或等待
```

**策略优先级：** Unit 级 `policyOverrides` > Workflow 级 `PolicyConfig` > 全局默认。

**与 ControlFlow 协作：**

- ParallelFlow 中某 Unit 失败 → `onError` 返回 `skip` → 其他 Unit 继续
- Token 预算耗尽 → `preCheck` 返回 `abort` → 保存 Checkpoint 后终止
- 超时 → `cancel()` RuntimeAdapter → 按 retry 策略重试或 abort

### 4.5 SecurityGovernance — 安全治理

```typescript
interface SecurityGovernance {
  preHook(ctx: SecurityContext): SecurityDecision;
  postHook(ctx: SecurityContext, output: AgentOutput): SanitizedOutput;
}

interface SecurityContext {
  caller: CallerIdentity;
  unitId: UnitId;
  tools: Tool[];
  input: AgentInput;
  secrets: SecretRefMap;
}

type SecurityDecision =
  | { action: 'allow' }
  | { action: 'deny'; reason: string }
  | { action: 'require-hitl'; action: string; payload: any };
```

**子模块：**

| 模块 | 职责 | 实现要点 |
|------|------|---------|
| AuthN/Z | 调用方身份 + Unit/Tool 三级权限 | JWT/API Key；RBAC 策略表 |
| ToolPolicy | 工具白名单 + 参数 schema 校验 | JSON Schema 验证工具参数 |
| SecretMgr | 密钥注入，SharedState 仅存 `SecretRef` | Vault/K8s Secrets 后端 |
| PIIGuard | 输入输出 PII 检测与脱敏 | 正则 + NER 模型；可配置规则 |
| AuditTrail | 全操作审计日志 | 写入 MessageBus + 持久存储 |
| HITL Gate | 高风险操作人工审批 | 暂停工作流 → 等待审批 → 恢复 |
| PromptInjection Defense | 用户输入注入检测 | 规则 + 分类器 |
| RateLimit/Quota | 调用频率与资源配额 | 令牌桶；与 PolicyEngine 共享预算 |

**Hook 执行顺序：**

```
preHook:  AuthZ → ToolPolicy → PIIGuard.sanitize(input) → SecretMgr.inject → PromptInjection.check
postHook: PIIGuard.sanitize(output) → AuditTrail.log
```

---

## 跨语言 SDK 与部署架构

### 部署拓扑

```
┌─────────────────────────────────────────────────────────────┐
│  Uni-Flow Orchestrator Service (Phase 2+)                    │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │ControlFlow│ContextMgr│Checkpoint│Policy    │Security  │  │
│  │Engine     │          │Store     │Engine    │Governance│  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
│  REST/gRPC API + MCP Server                                  │
└────────┬──────────────┬──────────────┬───────────────────────┘
         │              │              │
    ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
    │ TS SDK  │   │Python SDK│   │Java SDK │
    └────┬────┘   └────┬────┘   └────┬────┘
         │              │              │
    ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
    │业务项目  │   │LangGraph │   │LangChain│
    │(Node)   │   │项目      │   │4j 项目  │
    └─────────┘   └─────────┘   └─────────┘
```

### 分阶段落地

| 阶段 | 交付 | 说明 |
|------|------|------|
| **Phase 1** | TS 进程内参考实现 | pi-agent-core Adapter + 全部 Layer 4 接口（内存后端） |
| **Phase 2** | 编排服务 + MCP | 抽出 Orchestrator；Agent Unit 以 MCP Server 暴露 |
| **Phase 3** | Python/Java SDK | Sidecar 适配器 + Unit Wrapper；Redis + 向量 DB 后端 |

### SDK 最小契约（跨语言一致）

```
POST /workflows/{id}/runs          启动工作流
GET  /workflows/{id}/runs/{runId}  查询状态
POST /workflows/{id}/runs/{runId}/resume  断点恢复
POST /workflows/{id}/runs/{runId}/hitl     审批响应
GET  /memory/search?q=...          记忆检索
```

---

## Decisions

| 决策 | 选择 | 理由 | 备选 |
|------|------|------|------|
| 架构风格 | 混合 C：编排服务 + SDK | 跨语言、横切能力集中 | A 纯 Spec / B 纯 TS |
| Agent 执行 | RuntimeAdapter 黑盒 | 不绑定框架，支持 Bridge | 直接绑定 pi-agent-core |
| 跨语言协议 | REST + MCP | MCP 与 Cursor 生态对齐 | 仅 gRPC |
| 记忆存储 | 可插拔接口，默认 Redis + pgvector | 平衡复杂度与能力 | 全部内存 |
| 安全模型 | Hook 链，非侵入 | 不改 ControlFlow 逻辑 | 嵌入每个 Unit |
| 落地策略 | 三阶段演进 | 降低风险，快速验证 | 一步到位 |

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| MCP 协议不稳定 | Adapter 层隔离；HTTP 作为 fallback |
| 四层架构增加延迟 | Phase 1 进程内模式无网络开销；Checkpoint 异步写入 |
| LangGraph/LangChain 接口变更 | Bridge Adapter 独立版本管理 |
| 向量检索质量影响 Agent 效果 | ContextPolicy 可 per-Unit 关闭；人工审核检索结果 |
| 安全 Hook 误杀合法请求 | 所有策略可 per-Workflow 配置宽松/严格模式 |
| 并行 Unit 状态冲突 | SharedState.transaction() 乐观锁 + 冲突重试 |

## Migration Plan

1. **Phase 1**：在现有 TS 代码库中实现 Layer 4 接口（内存后端），WorkflowUnit 改用 RuntimeAdapter，原有 ControlFlow 不变
2. **Phase 2**：抽出 Orchestrator 为独立服务；TS SDK 改为 HTTP 客户端；添加 MCP Server 端点
3. **Phase 3**：发布 Python/Java SDK + Sidecar 适配器；业务项目按需接入（模式 A 或 B）
4. **回滚**：每阶段独立可回滚；Phase 1 进程内模式始终可作为 fallback

## Open Questions

- 向量数据库首选：pgvector（简单）vs Qdrant（专用）？建议 Phase 1 不引入，Phase 3 再选
- HITL 审批 UI：首期通过 API/Webhook 通知，不自建 UI
- Orchestrator 服务语言：TS（与 pi-agent-core 一致）vs Go（性能）？建议 TS 起步
