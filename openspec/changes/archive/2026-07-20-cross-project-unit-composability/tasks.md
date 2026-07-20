## 1. Core types and contracts

- [x] 1.1 扩展 `AgentInput`：可选 `params?: Record<string, unknown>`（`src/core/types.ts`）
- [x] 1.2 更新 `docs/remote-unit-http-contract.md`：`input.params` + secrets 禁令 + 透传说明
- [x] 1.3 补充/更新 HttpAdapter golden fixture 测试：出站 body 含 `params`

## 2. YAML loader and engine path

- [x] 2.1 修改 YAML 默认 `inputAdapter`：映射 `task` / `context` / `params`（`input.params` 或顶层 `params`）
- [x] 2.2 确保 `engine.run({ task, params })` 将 `params` 写入 SharedState（若尚未写入则补齐）
- [x] 2.3 单测：YAML builtin.mock 路径透传 `params`；无 `params` 时不报错

## 3. Workflow-as-Unit demo

- [x] 3.1 新增或扩展最小 demo：子服务内部跑简单 workflow，对外 `/execute` 返回 `AgentOutput`
- [x] 3.2 父 workflow 通过 bindings/`builtin.http` 调用子 `/execute`；README 写清三步
- [x] 3.3（可选）demo 中演示 `params.$profile` 与 metadata 回传

## 4. VitePress 档位 1（使用者旅程）

- [x] 4.1 更新 `.vitepress/config.ts` nav/sidebar：指南顺序按「安装 → 快速开始 → YAML → 跨项目 → uses → 跨语言(次)」
- [x] 4.2 重写首页 hero/features/「从这里开始」：跨项目复用为主；去掉「跨语言」作为主 feature 标题
- [x] 4.3 重写 `why/three-w.md`：Who/Why 纳入跨项目 Unit 复用
- [x] 4.4 扩展 `why/vs-frameworks.md`：增加 Mastra 对照表与互补结论（不替代）
- [x] 4.5 新增 `guide/cross-project.md`：四通道、`params`/`$profile`、Workflow-as-Unit vs workflow-run、链 demo
- [x] 4.6 更新 `guide/uses.md` 决策树；`guide/cross-lang.md` 导语改为手段说明并链到跨项目页
- [x] 4.7 更新示例索引与相关示例导语（单项目 vs 跨项目）；README / AGENTS 门户链接对齐
- [x] 4.8 `npm run docs:build` 通过；抽查首页 / 3W / vs / 跨项目 / uses

## 5. SDK alignment and verification

- [x] 5.1 TS 公开类型导出确认；Py/Java SDK 文档或类型注释对齐 `params`（透传即可）
- [x] 5.2 `npm test` 通过；相关契约/loader 测试覆盖 1.x–2.x
