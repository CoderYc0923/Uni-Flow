## 1. 项目脚手架与核心类型

- [x] 1.1 初始化 TypeScript 项目结构（`src/core`, `src/layer4`, `src/adapters`, `src/sdk`）
- [x] 1.2 定义核心类型：`WorkflowUnit`, `RuntimeAdapter`, `ControlFlow`, `SharedState`, `MessageBus`, `WorkflowEngine`
- [x] 1.3 从现有设计文档迁移七种 ControlFlow 实现（Loop/Sequential/Parallel/Router/DAG/Delegation/Composite）
- [x] 1.4 实现增强版 SharedState（作用域隔离 + transaction 乐观锁）
- [x] 1.5 实现增强版 MessageBus（扩展消息类型 + 过滤历史 + publishSync）

## 2. Layer 4 基础设施接口

- [x] 2.1 定义 ContextManager 接口与四层记忆模型类型（ContextPolicy, AssembledContext, CompactionStrategy）
- [x] 2.2 实现 ContextManager 内存版（Working/Session Memory + 上下文组装 + Token 预算 + sliding-window 压缩）
- [x] 2.3 定义 CheckpointStore 接口与 WorkflowSnapshot 类型
- [x] 2.4 实现 CheckpointStore 内存版（save/load/list + 控制流游标序列化）
- [x] 2.5 定义 Observability 接口（Span, Metrics, Logs, Cost）
- [x] 2.6 实现 Observability 内存版（层级 Span + Token 计量 + 结构化日志）
- [x] 2.7 定义 PolicyEngine 接口与 PolicyConfig 类型
- [x] 2.8 实现 PolicyEngine（重试/退避、超时、Token 预算、并行 failureStrategy）
- [x] 2.9 定义 SecurityGovernance 接口与子模块类型
- [x] 2.10 实现 SecurityGovernance 基础版（AuthZ 桩、ToolPolicy 白名单、AuditTrail 日志）

## 3. RuntimeAdapter 与 Framework Bridge

- [x] 3.1 实现 PiAgentAdapter（pi-agent-core 适配，迁移现有 PiWorkflowEngine 逻辑）
- [x] 3.2 实现 HttpAdapter 和 McpAdapter 骨架
- [x] 3.3 实现 WorkflowEngine 执行管线（串联 Layer 4 Hook 链）
- [x] 3.4 实现 HITLGateUnit 与审批恢复流程
- [x] 3.5 编写 PiAgentAdapter 集成测试（单 Unit LoopFlow + SequentialFlow）

## 4. Phase 1 端到端验证

- [x] 4.1 用代码审查工作流示例验证全管线（Router + DAG + Reflexion 混合模式）
- [x] 4.2 验证 Checkpoint 断点续跑（模拟中途中断 + resume）
- [x] 4.3 验证 PolicyEngine 重试与超时
- [x] 4.4 验证 ContextManager 跨 Unit 上下文传递
- [x] 4.5 更新 `Agent统一工作流模式设计.md` 加入第四层架构章节

## 5. Phase 2 编排服务化

- [x] 5.1 抽出 Orchestrator 为独立 HTTP 服务（Express/Fastify）
- [x] 5.2 实现 REST API（start run, get status, resume, HITL response）
- [x] 5.3 实现 CheckpointStore Redis 后端
- [x] 5.4 实现 MCP Server 端点（Agent Unit 远程调用）
- [x] 5.5 TS SDK 客户端（HTTP 客户端封装，支持 Phase 1 进程内 fallback）

## 6. Phase 3 跨语言 SDK 与 Bridge

- [x] 6.1 实现 ContextManager 向量检索后端（pgvector 接口）
- [x] 6.2 实现 ContextManager Long-term Memory 持久化后端
- [x] 6.3 实现 SecurityGovernance 完整版（PIIGuard, SecretMgr, PromptInjection）
- [x] 6.4 Python SDK + LangGraph Sidecar（UniFlowCheckpointer）+ LangGraphAdapter
- [x] 6.5 Python SDK + LangChain Sidecar（UniFlowMemory）+ LangChainAdapter
- [x] 6.6 Java SDK + LangChain4j Sidecar（UniFlowChatMemoryStore）+ LangChain4jAdapter
- [x] 6.7 Observability OpenTelemetry 导出集成
