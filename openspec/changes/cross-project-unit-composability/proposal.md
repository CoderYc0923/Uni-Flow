## Why

Uni-Flow 的主价值是跨项目复用同一套编排规范，而不是「同一工作流里混用多种语言子 Agent」。今天缺少父级向子 Unit 传递业务策略的标准通道，Remote Unit 契约与 YAML 默认 input 映射也不完整，导致「客服项目把 RAG 项目当 Unit」难以规范落地。同时 VitePress 文档仍偏「跨语言 / 模块目录」叙事，使用者旅程与 Mastra 等一体式框架的对照不够清晰，新人难快速判断「该不该用、怎么接别的项目」。

## What Changes

- 扩展 `AgentInput` 增加可选 `params?: Record<string, unknown>`（Engine 只透传）
- 同步 Remote Unit HTTP 契约与 YAML 默认 `inputAdapter`（state → `params`）
- 定义 **Workflow-as-Unit** 模式：对内完整 workflow，对外 Unit `/execute`
- 约定 capability profile（文档层 `$profile`，不进 Engine 类型系统）与 `AgentOutput.metadata` 可编程消费约定
- **VitePress 档位 1**：按使用者旅程重梳信息架构与关键页（首页、3W、vs 框架含 Mastra、uses、新跨项目指南、示例索引）；`跨语言` 降为手段子路径；原理区保留但后置
- **非 BREAKING**：`params` 为可选字段；旧 Unit 可忽略；不做全站逐页大改

## Capabilities

### New Capabilities

- `agent-input-params`: 标准业务策略信封（`AgentInput.params`、state 键约定、与 `unit.config` 合并优先级）
- `workflow-as-unit`: 对内 workflow、对外 Unit 契约的 Wrapper 模式与示例约定
- `capability-profile`: 文档层 profile（如 `rag.v1`）、版本演进与未知字段策略
- `docs-cross-project-composability`: 跨项目叙事、使用者旅程 IA、关键页重写、vs Mastra、uses 决策树

### Modified Capabilities

- `remote-unit-contract`: HTTP request `input` 增加 `params`；明确透传语义
- `yaml-loader`: 默认 `inputAdapter` 映射 `task` / `context` / `params`（及 run input 注入约定）
- `docs-product-narrative`: Why/首页口径对齐跨项目复用；框架对比纳入 Mastra

## Impact

- 代码：`src/core/types.ts`、`src/yaml/loader.ts`、HttpAdapter 相关测试、可选 SDK 类型对齐
- 契约：`docs/remote-unit-http-contract.md`
- 文档：`docs-web/` 导航与关键页、README/AGENTS 门户；参考 [Mastra](https://mastra.ai/) 的「先上手、按任务分路径」写法，不照搬其 Agents/Memory 产品结构
- Demo：可基于 `examples/cross-lang/` 扩展 Workflow-as-Unit 最小示例
- 不改 ControlFlow 拓扑语义；不实现生产 RAG/客服插件；不逐页改写全部模块/API 手册正文
