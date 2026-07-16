## 1. MkDocs 脚手架

- [x] 1.1 添加 `requirements-docs.txt`（mkdocs、mkdocs-material）与根目录 `mkdocs.yml`（Material、中文、nav 初稿）
- [x] 1.2 创建 `docs-site/` 目录与首页 `index.md`；`.gitignore` 忽略 `site/`
- [x] 1.3 本地验证 `mkdocs build`（或文档记录的等价命令）可通过

## 2. 内容梳理与撰写

- [x] 2.1 入门：安装、快速开始（Sequential / YAML）、核心概念
- [x] 2.2 原理：理念、四层架构、执行管线 Mermaid、ControlFlow vs ReAct
- [x] 2.3 编排：YAML、validate、uses/bindings、跨语言（链 examples/cross-lang）
- [x] 2.4 参考：API 速查、远程 Unit 契约、OpenSpec/设计长文索引、示例目录、FAQ、AGENTS 约定
- [x] 2.5 校对内外链接，避免坏链到已归档变更路径

## 3. GitHub Pages 发布

- [x] 3.1 新增 `.github/workflows/docs.yml`（build + deploy Pages）
- [x] 3.2 在站点或 README 写清启用 Pages、`site_url` 占位与维护说明
- [x] 3.3 （可选）`workflow_dispatch` 手动发布

## 4. README 重设计

- [x] 4.1 将 `README.md` 改写为门户结构（一句话、文档 CTA、安装、迷你示例、链接矩阵）
- [x] 4.2 移除/迁出长 Mermaid 与完整案例正文到文档站，README 保留入口链接
- [x] 4.3 更新 `AGENTS.md` 增加文档站路径说明（若适用）

## 5. 验收

- [x] 5.1 `mkdocs build` 成功；抽查导航页可打开
- [x] 5.2 README 门户可读性自检；文档站与 README 职责无大段重复
- [x] 5.3 确认未破坏现有 `npm test`（文档变更不引入运行时回归）
