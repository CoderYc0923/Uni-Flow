# 贡献

## 代码与编排

- 遵循 [`AGENTS.md`](https://github.com/OWNER/Uni-Flow/blob/main/AGENTS.md) 与 `.cursor/rules/uni-flow.mdc`
- 改 Workflow YAML 后运行 `npx uniflow validate <path>`
- 运行时变更请附带 `npm test`

## 文档

1. 编辑 `docs-site/**/*.md` 或根 `mkdocs.yml` 导航  
2. 本地 `mkdocs serve` 预览  
3. 推送到默认分支后由 Actions 发布 Pages（见 [GitHub Pages 部署](github-pages.md)）  

深度内容写在文档站；根 `README.md` 仅保持门户结构与外链。
