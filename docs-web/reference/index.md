# API 参考总览

本节为 **开发者手册**：每个 API 页包含定义、用途、参数表、返回值、错误与示例，便于查阅与复制。

## 如何阅读

1. **Orchestrator HTTP** — 跨进程 / 跨语言时通过 REST 调用执行核。
2. **SDK** — TypeScript / Python / Java 封装上述 HTTP，并提供本地 YAML 校验。
3. **进程内 API** — `createWorkflowEngine`、`createEngineFromYaml` 等，适合 TS 单进程集成。
4. **生成附录** — TypeDoc 从源码 JSDoc **自动生成**的符号索引（中文注解；需先运行 `npm run docs:api`）。先读[生成附录说明](/reference/typedoc-appendix)，再打开[附录正文](/reference/generated/)。

## 目录

### Orchestrator HTTP

| 路由 | 文档 |
|------|------|
| `GET /health` | [health](/reference/http/health) |
| `GET /workflows` | [workflows](/reference/http/workflows) |
| `POST /workflows/from-yaml` | [from-yaml](/reference/http/from-yaml) |
| `POST /workflows/:id/runs` | [start-run](/reference/http/start-run) |
| `GET /workflows/:id/runs/:runId` | [get-run](/reference/http/get-run) |
| `POST .../resume` | [resume](/reference/http/resume) |
| `POST .../hitl` | [hitl](/reference/http/hitl) |
| `GET /memory/search` | [memory-search](/reference/http/memory-search) |
| `POST /mcp` | [mcp](/reference/http/mcp) |

总表：[Orchestrator HTTP 索引](/reference/http/)

### SDK

| 包 | 文档 |
|----|------|
| TypeScript (`uni-flow`) | [typescript-sdk](/reference/typescript-sdk) |
| Python (`uniflow_sdk`) | [python-sdk](/reference/python-sdk) |
| Java (`io.uniflow.sdk`) | [java-sdk](/reference/java-sdk) |

### 进程内核心

| 模块 | 文档 |
|------|------|
| WorkflowEngine | [engine](/reference/engine) |
| YAML Loader | [yaml-api](/reference/yaml-api) |
| ControlFlow | [controlflow](/reference/controlflow) |
| Runtime Adapters | [adapters](/reference/adapters) |
| Layer4 组件 | [layer4](/reference/layer4) |

### 自动生成

| 页 | 说明 |
|----|------|
| [生成附录说明](/reference/typedoc-appendix) | 中文注解、再生命令、与手写手册的关系 |
| [生成附录（正文）](/reference/generated/) | TypeDoc 输出；`npm run docs:api` 更新 |

## 通用类型：RunRecord

HTTP 与 SDK 返回的运行记录结构：

| 字段 | 类型 | 说明 |
|------|------|------|
| `runId` | `string` | 运行 ID |
| `workflowId` | `string` | 工作流 ID |
| `status` | `'pending' \| 'running' \| 'paused' \| 'completed' \| 'failed'` | 运行状态 |
| `createdAt` | `number` | 创建时间戳（ms） |
| `updatedAt` | `number` | 更新时间戳（ms） |
| `result` | `WorkflowResult` | 完成或暂停时的结果（可选） |
| `error` | `string` | 失败时的错误消息（可选） |

`WorkflowResult` 主要字段：`runId`、`completedUnits`、`state`（含 `output.<unitId>`）、`messages`、`duration`、`tokenUsage`、`cost`。

## 远程 Unit 契约

HTTP Unit 实现细节见 GitHub：[Remote Unit HTTP Contract](https://github.com/CoderYc0923/Uni-Flow/blob/main/docs/remote-unit-http-contract.md)
