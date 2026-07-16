## 1. VitePress 脚手架与 CI

- [x] 1.1 添加 vitepress/typedoc 依赖与 `docs:dev` / `docs:api` / `docs:build` scripts
- [x] 1.2 创建 `docs-web/`：`.vitepress/config`（`base: /Uni-Flow/`、中文、默认主题+轻品牌色、nav/sidebar）
- [x] 1.3 更新 `.github/workflows/docs.yml` 为 Node VitePress + deploy-pages
- [x] 1.4 本地 `docs:build` 可通过（可先占位首页）

## 2. Why 叙事

- [x] 2.1 首页：Who/Why 一句话 + CTA（原理 / 快速开始 / API）
- [x] 2.2 写产品 3W（Who / Why / How）
- [x] 2.3 写与 LangGraph 等框架对比（共性/区别/互补结论）
- [x] 2.4 写模式变动抗性（稳定层 vs 易变层；纠正 Think/Execute/Observe 顶层误读）

## 3. 原理与规划重梳

- [x] 3.1 问题→约束→两层模型总览图（Mermaid）；明确非顶层 ReAct 三件套
- [x] 3.2 执行管线详解（与引擎顺序一致）+ Layer4「若没有会怎样」
- [x] 3.3 模块地图 + 各核心模块 3W 页（Unit/Adapter/ControlFlow/State/Bus/Engine/L4/YAML/Orch/SDK/CLI）
- [x] 3.4 路线图页；设计长文迁入附录并加导读
- [x] 3.5 确认原理/Why 章不以记账故事为主脊柱

## 4. 指南与示例

- [x] 4.1 安装与快速开始、YAML/validate、uses、跨语言概览
- [x] 4.2 示例索引；记账 Router 示例页；Sequential/跨语言入口

## 5. API 手册

- [x] 5.1 Orchestrator HTTP 逐路由手册（对齐 server.ts；链 remote-unit 契约）
- [x] 5.2 TypeScript SDK / Engine / YAML / ControlFlow / Adapters / Layer4 精品页
- [x] 5.3 Python / Java SDK 主表面手册页
- [x] 5.4 配置 TypeDoc → `reference/generated/`；接入 `docs:api` / `docs:build`

## 6. 仓库门户与退役 MkDocs

- [x] 6.1 更新 `README.md` 门户（链 VitePress Why/API/示例）
- [x] 6.2 更新 `AGENTS.md` 指向 `docs-web/`
- [x] 6.3 根设计长文 stub 或改链；退役 MkDocs 主路径（mkdocs.yml / docs-site / requirements-docs）

## 7. 验收

- [x] 7.1 `npm run docs:build` 成功；抽查 Why/原理/HTTP/SDK 页
- [x] 7.2 主路径通读：3W、两层模型、vs LangGraph、抗性、API 可查
- [x] 7.3 `npm test` 通过（无运行时回归）
