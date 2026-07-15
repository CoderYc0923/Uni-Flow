# OpenSpec 与设计长文索引

站点 **不** 镜像 `openspec/changes/` 变更全文；请直接阅读仓库路径。

## 能力规范（主 specs）

- [`openspec/specs/`](https://github.com/OWNER/Uni-Flow/tree/main/openspec/specs) — 已归档的能力需求

## 设计长文（仓内保留）

| 文档 | 路径 |
|------|------|
| Agent 统一工作流模式设计 | `Agent统一工作流模式设计.md` |
| 标准库 + YAML 双轨 | `docs/superpowers/specs/2026-07-14-uniflow-standard-library-yaml-design.md` |
| SDK 完全体 | `docs/superpowers/specs/2026-07-14-uniflow-sdk-complete-design.md` |
| 远程 Unit HTTP 契约 | `docs/remote-unit-http-contract.md` |

## 规划（路线图摘要）

| 阶段 | 内容 | 状态 |
|------|------|------|
| Now / P0 | TS 引擎、Layer4、YAML Schema/Loader/`validate`、模板、AI 规则 | ✅ |
| SDK 完全体 C1–C4 | from-yaml + bindings；Py/Java；demo；Unit 契约；artifacts 口子 | ✅ |
| 以后 | 业务真仓 Wrapper、Artifact 语义、包仓库发布、Registry 持久化、更强 builtin | 📋 |

目标形态：依赖引擎 + YAML 编排真源 + 多语言 SDK + Schema/Rules（**不做控制台平台**）。
