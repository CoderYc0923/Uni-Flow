## 1. TypeDoc / 站点呈现

- [x] 1.1 更新生成附录导读或导航说明（中文注解、由 `docs:api` 再生）
- [x] 1.2 按需微调 `typedoc.json`（标题/分组等），确认 `docs:api` 仍成功

## 2. P0 中文 JSDoc

- [x] 2.1 为 YAML / Engine 入口补中文 JSDoc（`createEngineFromYaml`、validate、`createWorkflowEngine` 及相关 options）
- [x] 2.2 为 Workflow-as-Unit 助手与 `AgentInput` / `AgentOutput`（及 params 等关键字段）补中文注解
- [x] 2.3 为 Mock / Http 等主 RuntimeAdapter 工厂与 `UniFlowClient` 补中文 JSDoc（含 `@param` / `@returns`）

## 3. P1 / P2 中文 JSDoc

- [x] 3.1 为常用 ControlFlow 类与关键 options 补中文用途 + 方法/参数说明
- [x] 3.2 其余 `src/index.ts` 再导出公开符号至少补一行中文用途（复杂方法优先补全）

## 4. 手写 API 手册对齐

- [x] 4.1 更新 `docs-web/reference` 中 P0 相关手写页：中文用途/参数表 + 链到生成附录

## 5. 小白分步教程

- [x] 5.1 重写/扩写 `guide/install.md`（前置、步骤、预期、FAQ）
- [x] 5.2 重写/扩写 `guide/quickstart.md`（术语引入、A/B 轨道、逐步预期结果）
- [x] 5.3 重写/扩写 `guide/yaml.md`（从空文件到可跑 Sequential）
- [x] 5.4 扩写 `guide/cross-project.md` TS↔TS 跟做步骤与预期现象

## 6. 验证

- [x] 6.1 `npm run docs:api` 后抽查 P0 生成页含中文用途与参数说明
- [x] 6.2 `npm run docs:build` 通过
