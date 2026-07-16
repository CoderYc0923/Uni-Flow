# 参与贡献

感谢考虑为 Uni-Flow 文档与代码做贡献。本节说明文档站点结构与 Agent 协作约定。

## 文档站点（VitePress）

- 源码目录：`docs-web/`
- 本地预览：`npm run docs:dev`
- 完整构建：`npm run docs:build`（含 `npm run docs:api` TypeDoc 附录）

编辑 Markdown 后提交 PR 即可；侧边栏路由在 [`docs-web/.vitepress/config.ts`](https://github.com/CoderYc0923/Uni-Flow/blob/main/docs-web/.vitepress/config.ts) 中配置。

## 编码 Agent 约定

自动化 Agent 与贡献者应阅读仓库根目录 [**AGENTS.md**](https://github.com/CoderYc0923/Uni-Flow/blob/main/AGENTS.md)，核心规则包括：

1. **拓扑在 YAML** — 改 `units` / `flow` / `policy`，不要手写多 Agent 调度循环。
2. **新能力走 `uses` 插件** — 注册到 `createEngineFromYaml` 的 `registry` 或 Orchestrator `bindings`。
3. **YAML 编辑后 validate** — `npx uniflow validate <path>`。
4. **双轨** — 默认 YAML；Composite 等 YAML v1 无法表达的部分用 `createWorkflowEngine` 代码 API。

## 文档分工

| 路径 | 受众 | 内容 |
|------|------|------|
| `docs-web/` | 开发者手册 | Why、原理、指南、示例、API（本站） |
| `AGENTS.md` | AI Agent | 硬规则与路径索引 |

## 提交流程建议

1. Fork / 分支开发
2. `npm run build && npm test`
3. 若改 YAML：`npx uniflow validate ...`
4. 若改文档：`npm run docs:dev` 本地预览
5. 提交 PR 到 [CoderYc0923/Uni-Flow](https://github.com/CoderYc0923/Uni-Flow)

## 相关链接

- [安装指南](/guide/install)
- [AGENTS.md](https://github.com/CoderYc0923/Uni-Flow/blob/main/AGENTS.md)
