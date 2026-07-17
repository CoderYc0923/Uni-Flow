## Why

Uni-Flow 的主价值是跨项目复用同一套编排规范，而不是「同一工作流里混用多种语言子 Agent」。今天缺少父级向子 Unit 传递业务策略的标准通道，Remote Unit 契约与 YAML 默认 input 映射也不完整，导致「客服项目把 RAG 项目当 Unit」难以规范落地。

## What Changes

- 扩展 `AgentInput` 增加可选 `params?: Record<string, unknown>`（Engine 只透传）
- 同步 Remote Unit HTTP 契约与 YAML 默认 `inputAdapter`（state → `params`）
- 定义 **Workflow-as-Unit** 模式：对内完整 workflow，对外 Unit `/execute`
- 约定 capability profile（文档层 `$profile`，不进 Engine 类型系统）与 `AgentOutput.metadata` 可编程消费约定
- 更新文档叙事：跨项目复用为主；多语言 SDK / HTTP 为手段；Orchestrator workflow-run 为旁路调用
- **非 BREAKING**：`params` 为可选字段；旧 Unit 可忽略

## Capabilities

### New Capabilities

- `agent-input-params`: 标准业务策略信封（`AgentInput.params`、state 键约定、与 `unit.config` 合并优先级）
- `workflow-as-unit`: 对内 workflow、对外 Unit 契约的 Wrapper 模式与示例约定
- `capability-profile`: 文档层 profile（如 `rag.v1`）、版本演进与未知字段策略
- `docs-cross-project-composability`: 文档口径与 uses 决策树对齐跨项目复用叙事

### Modified Capabilities

- `remote-unit-contract`: HTTP request `input` 增加 `params`；明确透传语义
- `yaml-loader`: 默认 `inputAdapter` 映射 `task` / `context` / `params`（及 run input 注入约定）

## Impact

- 代码：`src/core/types.ts`、`src/yaml/loader.ts`、HttpAdapter 相关测试、可选 SDK 类型对齐
- 契约：`docs/remote-unit-http-contract.md`
- 文档：`docs-web/guide/uses.md`、cross-lang / 新 cross-project 指南、AGENTS/README 口径
- Demo：可基于 `examples/cross-lang/` 扩展 Workflow-as-Unit 最小示例
- 不改 ControlFlow 拓扑语义；不实现生产 RAG/客服插件
