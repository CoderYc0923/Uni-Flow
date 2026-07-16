## Why

MkDocs 叙事站仍难讲清 Uni-Flow 的 Who/Why/How、与 LangGraph 等框架的关系、模式变动抗性，以及两层模型/管线/Layer4；API/HTTP/SDK 只有速查表，达不到可对外使用的手册级文档。需要一期切换到 VitePress，重建可读叙事与完整参考文档，并部署到 GitHub Pages。

## What Changes

- **BREAKING（文档栈）**：以 VitePress（`docs-web/`）替代 MkDocs 作为文档站真源；退役 `mkdocs.yml` / `docs-site` 主路径与 Python docs 构建依赖
- 重写站点 IA：Why（3W / 对比 / 抗性）→ 原理与规划（重梳模型·管线·Layer4·模块 3W）→ 指南 → 示例 → API 参考
- 记账故事**仅**出现在示例区，不进原理主叙事
- 手写精品 API 页（Orchestrator HTTP、TS/Py/Java SDK、Engine/YAML 等）+ TypeDoc 生成附录（`docs:api` 可定期刷新）
- `Agent统一工作流模式设计.md` 迁入站点作附录；README 门户化对齐新站；AGENTS 链到新原理入口
- GitHub Actions Pages 改为 Node `docs:build` + `deploy-pages`（`base: /Uni-Flow/`）
- 不改 Engine / 运行时行为

权威设计稿：`docs/superpowers/specs/2026-07-16-vitepress-docs-overhaul-design.md`

## Capabilities

### New Capabilities

- `vitepress-documentation-site`: VitePress 站点脚手架、导航、主题、构建脚本与 GH Pages 部署
- `docs-product-narrative`: 产品 Who/Why/How、与市面框架对比、模式变动抗性
- `docs-architecture-explainer`: 两层模型、执行管线、Layer4、模块 3W、路线图与设计长文入站
- `docs-api-handbook`: HTTP/SDK/核心 API 手册级页面 + TypeDoc 附录流水线
- `docs-examples-guide`: 示例索引；记账 Router 等业务故事仅在此区

### Modified Capabilities

- `readme-usage-guide`: README 门户对齐 VitePress 站（Why/原理/API/示例链接）；不以 MkDocs 路径为准
- `uniflow-ai-conventions`: AGENTS 指向 VitePress 文档路径与原理入口

## Impact

- 新增：`docs-web/`、vitepress/typedoc 依赖、`docs:*` scripts、更新 `.github/workflows/docs.yml`
- 更新：`README.md`、`AGENTS.md`；设计长文迁入或 stub
- 移除/归档：MkDocs 主路径（`mkdocs.yml`、`requirements-docs.txt`、旧 `docs-site`）
- 不影响：`src/` 运行时与测试契约语义
