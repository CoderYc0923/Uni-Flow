## Why

P0 已落地 YAML Schema / Loader / validate，但跨语言项目仍无法「交同一份 YAML」到统一执行核跑通；Python/Java SDK 仅有 HTTP run，缺少 validate/注册。现需按已定稿的 SDK 完全体设计，把 Uni-Flow 收成可接入各类 Agent 项目的编排标准体 SDK（不做平台）。

## What Changes

- Orchestrator 新增 `POST /workflows/from-yaml`（validate + bindings → 注册 → 可 run）
- `uses` 远程绑定：`bindings` 映射到 `builtin.http`；缺 binding 非 builtin 则 fail-fast
- Python / Java SDK：共用 Schema 做 `validate`，以及 `load_and_register` / `run` 与 TS HTTP 表面对齐
- 三端轻量 demo：`examples/cross-lang/`（共享 greeter YAML + TS/Py/Java）
- 远程 Unit JSON 契约文档 + 黄金 fixture；跨语言接入 / `uses` 决策图 / Registry 内存态说明
- P3：文档化 `artifacts` 预留键（透传、不实现语义）
- 分层契约测试（Schema 矩阵、from-yaml、Orchestrator、Unit 契约、E2E、回归）
- 不改 accounting-tool / 剪辑真仓；不重写 Py/Java Engine；不做控制台

## Capabilities

### New Capabilities

- `orchestrator-yaml-register`: Orchestrator 从 YAML 注册工作流与 bindings 解析
- `cross-lang-sdk-yaml`: Python/Java（及 TS HTTP）统一的 validate / register / run 表面
- `cross-lang-demos`: 三端轻量 E2E demo 与启动脚本
- `remote-unit-contract`: HttpAdapter 对齐的远程 Unit 请求/响应契约与测试 fixture
- `artifact-extension-hook`: `artifacts` 扩展口文档（引擎不解释）

### Modified Capabilities

- `workflow-orchestrator`: 增加 from-yaml 注册路由及相关错误行为（与现有 runs API 并存）
- `yaml-loader`: 支持经由 registry/bindings 将 HTTP 类 `uses` 解析进 Loader（供 Orchestrator 复用）

## Impact

- `src/orchestrator/`、`src/yaml/`、`src/sdk/`、`sdk/python/`、`sdk/java/`
- `examples/cross-lang/`、`tests/`、README / AGENTS / 契约文档
- 可选依赖：Python `jsonschema` / `PyYAML`；Java Schema 校验库
- 不影响：现有进程内 `createEngineFromYaml` 兼容行为；无 **BREAKING** API 移除
