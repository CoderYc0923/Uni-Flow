## Context

项目文档现状：根 README ~500+ 行兼做理念/教程/API；另有 `Agent统一工作流模式设计.md`、`docs/superpowers/specs/*`、`docs/remote-unit-http-contract.md`、`examples/**/README`、`AGENTS.md`、`openspec/specs`。SDK 完全体与 YAML 路径已可用，缺统一、可部署的文档入口。

选用 **MkDocs + Material**：Markdown 原生、导航/搜索/版本友好、GitHub Pages 成熟。

## Goals / Non-Goals

**Goals:**

- 文档站覆盖：简介、原理与架构、安装与快速开始、YAML 编排、跨语言、API/契约索引、示例索引、FAQ、贡献/Agent 约定
- GitHub Actions 自动构建并部署到 GitHub Pages
- README 改为门户：价值一句话、徽章/文档链接、安装、迷你示例、链到文档站深度内容
- 本地可 `mkdocs serve` 预览

**Non-Goals:**

- 不另建 VitePress/Docusaurus（本期锁定 MkDocs Material）
- 不把 OpenSpec 变更目录全文镜像进站点（可链接仓库路径）
- 不写运行时功能代码；不做多语言站点翻译（中文为主，API 标识英文）
- 不强求自定义复杂视觉主题（Material 默认 + 合理配色/logo 即可）

## Decisions

### D1: 站点源码目录

- **选择：** `docs-site/` 作为 MkDocs `docs_dir`（避免与现有 `docs/superpowers`、契约文混淆）；`mkdocs.yml` 位于仓库根。  
- **备选：** 全部塞进 `docs/` → 否决（与设计稿/契约混杂）。  
- 现有 `docs/*.md`：站点内用相对拷贝/摘要页或 `mkdocs` 外链到 GitHub raw/blob。

### D2: 内容策略（单源优先）

- 教程与原理：**站点页为权威**（从 README/设计文提炼改写，非盲目整文件粘贴）。  
- 长文设计：`docs/superpowers/specs/...` 保留在仓；站点放「摘要 + 仓库链接」。  
- README：门户 only，避免与站点长文双写；公共「快速开始」可短同步，细节只站内更新。

### D3: 导航信息架构（初稿）

```
首页
入门 → 安装 · 快速开始 · 核心概念
原理 → 设计理念 · 四层架构 · 执行管线 · ControlFlow vs ReAct
编排 → YAML 编排 · validate · uses 与插件 · 跨语言
参考 → API 速查 · 远程 Unit 契约 · OpenSpec 索引 · 示例目录
运维/FAQ → FAQ · Agent 约定 · 贡献
```

### D4: GitHub Pages 部署

- **选择：** `peaceiris/actions-gh-pages` 发布 `site/`，或官方 `actions/deploy-pages` + `mkdocs build`；触发 `push` 到 `main`（及手动 `workflow_dispatch`）。  
- `site/` 加入 `.gitignore`。  
- 文档说明：Settings → Pages → Source = GitHub Actions；`site_url` 在 `mkdocs.yml` 用占位或相对，首次部署后可改成真实 `https://<user>.github.io/Uni-Flow/`。

### D5: README 重设计要点

- 英雄区：项目名 + 一句话 + 文档站 CTA + 安装命令  
- 三段：为什么用 / 怎么开始（≤15 行代码）/ 下一步（链到文档）  
- 能力表极简；路线图一行 + 链文档「规划」页  
- 去掉超长 Mermaid（迁移到文档站原理页）  
- 保留 License / 相关链接

### D6: 依赖

- `requirements-docs.txt`：`mkdocs>=1.6`、`mkdocs-material>=9`  
- 可选：`mkdocs-mermaid2-plugin` 或 Material 内置 fence 渲染 Mermaid（实现时选其一并在 design 落地）

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| README 与站点内容漂移 | README 只门户；CI 不做全文 diff，靠 AGENTS 约定 |
| Pages URL / base path 错 | `site_url`/`extra` 文档化；相对链接优先 |
| 把 `docs/superpowers` 挪坏 | 不移动，只链接 |
| Material 默认外观偏「通用」 | 允许调 `palette`/`font`；不阻 DoD |

## Migration Plan

1. 加 MkDocs 骨架与导航空页 → 填内容 → 本地 serve 验收  
2. README 切换为门户并链站点（本地路径 + 部署后 URL）  
3. 合并后开启 GitHub Pages；首次 workflow 失败按文档修 `permissions`/`site_url`  
4. 回滚：删 workflow + 恢复旧 README（git）

## Open Questions

- 仓库公开名与 Pages URL 以实际 GitHub 远端为准（实现时写清占位符 `OWNER/REPO`）  
- 是否在站点启用在线搜索（Material 默认推荐开启）
