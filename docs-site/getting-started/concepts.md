# 核心概念

## WorkflowUnit

最小可调度单元：`runtime`、终止策略、`inputAdapter` / `outputAdapter`，可选 `contextPolicy`、`policyOverrides`。

## ControlFlow

| 类型 | 场景 |
|------|------|
| `LoopFlow` | 自循环 / Reflexion |
| `SequentialFlow` | 流水线 |
| `ParallelFlow` | 并行 + Reducer |
| `RouterFlow` | 分流 |
| `DAGFlow` | Plan-and-Execute |
| `DelegationFlow` | 多 Agent 委派 |
| `CompositeFlow` | 嵌套组合 |

Unit **不感知**自己处于何种 ControlFlow；由引擎按调度策略取下一批 Unit。

## RuntimeAdapter

统一 `execute` / `steer` / `followUp`。YAML 的 `uses:` 最终解析到 Adapter 或 Unit 工厂。

学习阶段可用 `createMockAdapter`，无需 API Key。生产中可挂 Pi、HTTP、MCP 等实现。

## SharedState / MessageBus

- **SharedState**：跨 Unit 的黑板（如 `output.<unitId>`）
- **MessageBus**：编排层事件与消息投递

## 进程内 vs 远程

| 模式 | 用法 |
|------|------|
| 进程内 | `createWorkflowEngine` / `createEngineFromYaml`，或无 `baseUrl` 的 `UniFlowClient` |
| 远程 | `createOrchestratorServer` + `createUniFlowClient({ baseUrl })` |

## Layer 4（横切）

| 组件 | 作用 |
|------|------|
| ContextManager | 工作 / 会话 / 长期 / 向量记忆 |
| CheckpointStore | 快照与 `resume` |
| PolicyEngine | 重试、超时、预算、熔断 |
| SecurityGovernance | 鉴权、工具策略、PII、注入、HITL |
| Observability | Span / Metrics / Cost |

详见 [四层架构](../concepts/architecture.md) 与 [执行管线](../concepts/pipeline.md)。
