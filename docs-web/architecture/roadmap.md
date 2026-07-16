# 路线图

本文记录 Uni-Flow **当前已交付**与**后续方向**，与仓库 OpenSpec 变更对齐。状态以 main 分支实现为准。

## 现在（已可用）

| 里程碑 | 内容 | 状态 |
|--------|------|------|
| **P0 编排核心** | Engine、七种 ControlFlow、WorkflowUnit、RuntimeAdapter（含 Mock） | ✅ 完成 |
| **YAML v1** | Schema、Loader、`uniflow validate`、模板 `examples/templates/` | ✅ 完成 |
| **Layer4 内存实现** | Policy、Security、Context、Checkpoint、Observability | ✅ 完成 |
| **Orchestrator** | HTTP：`from-yaml`、启动 run、查询、resume、HITL 等 | ✅ 基础完成 |
| **SDK 完整面（跨语言）** | TypeScript 核 + Python/Java SDK（validate + HTTP 调用） | ✅ 完成 |
| **示例与测试** | Mock 工作流、Router YAML、跨语言 demo、`npm test` | ✅ 完成 |
| **文档站（VitePress）** | Why / 原理 / 指南 / API 手册迁移 | 🟡 进行中 |

## P0 交付物明细

以下被视为「空壳质疑」的正面回答——编排与校验是实的：

- `src/core/` — ControlFlow、Engine、State、Bus
- `src/layer4/` — 横切组件与引擎挂钩
- `src/yaml/` — `createEngineFromYaml`
- `src/orchestrator/` — 进程级 HTTP 入口
- `sdk/python`、`sdk/java` — 结构验证与远程调用
- `schemas/uniflow.workflow.schema.json` — 机器可读契约

领域插件（真实模型、业务 API）由使用方通过 `uses` 或 HTTP Unit 接入 — 🟡 **演示用 `builtin.mock`，非成品行业方案**。

## SDK 完整（跨语言）— 已完成

设计文档：`docs/superpowers/specs/2026-07-14-uniflow-sdk-complete-design.md`

| 能力 | 说明 |
|------|------|
| 结构 validate | 各语言侧校验 YAML 形状 |
| `from-yaml` + bindings | 远程注册 HTTP Unit |
| start / get run | 统一 `runId`、`status`、`result.state` |
| 远程 Unit 契约 | `docs/remote-unit-http-contract.md` |

Demo 路径：`examples/cross-lang/`（起核 → 起 Unit → SDK 调用）。

## 文档与开发者体验（进行中）

| 项 | 说明 |
|----|------|
| VitePress `docs-web/` | 替代 MkDocs 人读主路径 |
| 精品 API 手册 | HTTP 逐路由、SDK 主表面 |
| TypeDoc 附录 | `docs:api` → `reference/generated/` |
| README / AGENTS 对齐 | 门户指向新站 |

## 后续（规划项）

以下尚未承诺排期，但方向已在 spec 或代码注释中预留：

| 方向 | 说明 | 状态 |
|------|------|------|
| **YAML v1 扩展** | 更丰富的 Composite 声明 | 🟡 复杂拓扑仍推荐代码 API |
| **向量记忆后端** | Context 生产级检索 | 🟡 接口已有，需接库 |
| **Redis Checkpoint** | 分布式恢复 | 🟡 可选依赖 |
| **OpenTelemetry** | 全链路 OTel 导出 | 🟡 可选依赖 |
| **`artifacts` 扩展** | 多模态制品元数据透传 | ⬜ 引擎仅 pass-through |
| **MCP / 工具生态** | Orchestrator `/mcp` 等集成 | 🟡 按 HTTP 手册演进 |
| **行业模板库** | 更多可 fork 的 Workflow 模板 | 🟡 社区贡献 |

## 如何参与

- 拓扑与模板：提 PR 到 `examples/templates/`
- 文档：改 `docs-web/`，跑 `npm run docs:build`
- 运行时：遵循 `AGENTS.md` — YAML 优先、`uses` 插件、改完 `validate`

## 若你只记住一件事

**P0 编排 + SDK 跨语言已落地；缺的是你的领域 Unit 与可选后端。** 文档站迁移进行中，API 以 `/reference/` 为准。
