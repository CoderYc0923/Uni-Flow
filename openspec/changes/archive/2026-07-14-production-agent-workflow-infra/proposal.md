## Why

现有的 Agent 统一工作流模式设计（WorkflowUnit + ControlFlow + MessageBus/SharedState）在编排抽象上已逻辑自洽，但缺少生产级运行所需的基础设施层——上下文管理、持久化、可观测性、容错策略、安全治理，以及跨语言/跨框架适配能力。业务项目使用 Node/Java/Python 等不同语言，且可能已接入 LangGraph/LangChain 等框架，需要在不改动原有架构的前提下获得统一的横切能力。

## What Changes

- 在现有三层模型之上新增 **Layer 4: Infrastructure Plane**（横切基础设施层）
- 将 WorkflowUnit 从 pi-agent-core 绑定解耦，引入 **RuntimeAdapter** 统一执行契约
- 新增 **ContextManager**：工作记忆、会话记忆、长期记忆、向量检索、上下文压缩
- 新增 **CheckpointStore**：工作流快照、断点续跑、事件溯源
- 新增 **Observability**：分布式追踪、指标、结构化日志、Token/成本计量
- 新增 **PolicyEngine**：重试、超时、熔断、Token 预算、并发控制
- 新增 **SecurityGovernance**：鉴权、工具沙箱、密钥管理、PII 脱敏、审计、HITL 审批
- 新增 **Framework Bridge**：LangGraph/LangChain/LangChain4j/pi-agent-core/MCP/HTTP 零侵入适配
- 增强 Layer 3：MessageBus 投递语义、SharedState 作用域与事务
- 定义跨语言 SDK 契约与分阶段落地路径（TS 参考实现 → 编排服务 → 多语言 SDK）

## Capabilities

### New Capabilities

- `runtime-adapter`: WorkflowUnit 运行时适配器契约与多框架 Bridge 实现
- `context-manager`: 分层记忆、向量检索、上下文窗口管理与压缩策略
- `checkpoint-store`: 工作流状态快照、断点续跑与事件溯源
- `observability`: 追踪、指标、日志与成本计量
- `policy-engine`: 重试、超时、熔断、预算与并发策略
- `security-governance`: 鉴权、工具策略、密钥、PII、审计与 HITL
- `message-bus-enhanced`: 增强消息总线（投递语义、排序、背压）
- `shared-state-enhanced`: 增强共享状态（作用域、类型、并发安全）
- `workflow-orchestrator`: 编排服务核心与跨语言 SDK 契约

### Modified Capabilities

（无现有 spec，均为新增）

## Impact

- 扩展 `Agent统一工作流模式设计.md` 概念模型，新增第四层及相关接口定义
- 新增 Uni-Flow 编排服务（Phase 1 为 TS 进程内参考实现）
- 新增 Python/Java/TypeScript SDK 与 Framework Bridge 适配器
- 依赖外部存储：Redis（Checkpoint/State）、向量数据库（记忆检索）、可选 OpenTelemetry 后端
- 与 pi-agent-core、LangGraph、LangChain、LangChain4j 通过 Adapter 集成，不替换现有框架
