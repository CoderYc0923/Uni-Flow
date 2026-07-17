## 1. Core types and contracts

- [ ] 1.1 扩展 `AgentInput`：可选 `params?: Record<string, unknown>`（`src/core/types.ts`）
- [ ] 1.2 更新 `docs/remote-unit-http-contract.md`：`input.params` + secrets 禁令 + 透传说明
- [ ] 1.3 补充/更新 HttpAdapter golden fixture 测试：出站 body 含 `params`

## 2. YAML loader and engine path

- [ ] 2.1 修改 YAML 默认 `inputAdapter`：映射 `task` / `context` / `params`（`input.params` 或顶层 `params`）
- [ ] 2.2 确保 `engine.run({ task, params })` 将 `params` 写入 SharedState（若尚未写入则补齐）
- [ ] 2.3 单测：YAML builtin.mock 路径透传 `params`；无 `params` 时不报错

## 3. Workflow-as-Unit demo

- [ ] 3.1 新增或扩展最小 demo：子服务内部跑简单 workflow，对外 `/execute` 返回 `AgentOutput`
- [ ] 3.2 父 workflow 通过 bindings/`builtin.http` 调用子 `/execute`；README 写清三步
- [ ] 3.3（可选）demo 中演示 `params.$profile` 与 metadata 回传

## 4. Documentation narrative

- [ ] 4.1 更新 `docs-web/guide/uses.md` 决策树：跨项目/部署边界为主；多语言为手段
- [ ] 4.2 新增或改写 cross-project 指南：四通道控制、`params`、Workflow-as-Unit vs workflow-run 旁路
- [ ] 4.3 补充 capability profile 文档模板（`$profile`、版本、metadata 键示例）
- [ ] 4.4 对齐 README / AGENTS 门户口径（链到新指南）；必要时轻改 cross-lang 页导语

## 5. SDK alignment and verification

- [ ] 5.1 TS 公开类型导出确认；Py/Java SDK 文档或类型注释对齐 `params`（透传即可）
- [ ] 5.2 `npm test` 通过；相关契约/loader 测试覆盖 1.x–2.x
- [ ] 5.3 `npm run docs:build`（若改了 docs-web）通过
