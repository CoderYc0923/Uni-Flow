## Context

P0 YAML Schema/Loader/CLI 已落地；Python/Java SDK 仅有 Orchestrator HTTP 客户端与 Sidecar 桥。已定稿设计见 `docs/superpowers/specs/2026-07-14-uniflow-sdk-complete-design.md`（方案 2：单一 TS 执行核 + 多语言 YAML 客户端）。本变更实现 C1–C4。

## Goals / Non-Goals

**Goals:**

- Orchestrator `from-yaml` + bindings → 可 run
- Py/Java（及 TS HTTP）validate / register / run 对齐
- 三端轻量 demo + 启动脚本；全面契约测试
- 文档：跨语言接入、`uses` 决策图、Unit 契约、Registry 内存态、artifacts 口子

**Non-Goals:**

- 控制台 / 多租户；Py/Java 重写 Engine；改业务真仓；Artifact 语义实现；强制包仓库发布；Registry 持久化

## Decisions

### D1: 单一执行核

- **选择：** 仅 TS Engine 执行编排；多语言经 Orchestrator。  
- **备选：** 三端各实现 Engine → 否决（语义漂移）。

### D2: bindings 在注册请求中传递

- **选择：** `POST /workflows/from-yaml` body 含 `bindings`；服务端合成 registry（custom name → `builtin.http` + endpoint）。  
- **备选：** 写入 YAML → 否决（端点/环境易泄密、污染真源）。

### D3: demo 用 HTTP Unit + 共享 YAML

- **选择：** 最小 greeter + sequential；证明闭环而非垂直业务。  
- **备选：** 直接接 accounting-tool → 否决（超出 DoD）。

### D4: Schema 单文件共用

- **选择：** 继续 `schemas/uniflow.workflow.schema.json`；Py/Java 读取同路径或打包副本保持字节一致。  
- **缓解漂移：** 共用 fixture 矩阵测三端 validate。

### D5: artifacts 仅文档约定

- **选择：** metadata/state 键名约定；引擎零逻辑。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| Schema 多语言不一致 | 单文件 + fixture |
| Orchestrator 单点 | 文档 + TS 进程内保留 |
| HTTP Unit 漂移 | 黄金契约测试 |
| 范围回胀 | DoD 绑定设计 §1.3 |

## Migration Plan

1. 合并后现有进程内/旧 HTTP run API 保持可用。  
2. 新客户端改用 from-yaml 注册。  
3. 回滚：关闭 from-yaml 路由即可，无数据迁移。

## Open Questions

- CI 是否默认起 Orchestrator 跑 Py/Java E2E（可先 manual/脚本，CI job 可选）。  
- Java 选型：标准 HttpServer + 轻量 Schema 库即可，避免强绑 Spring。
