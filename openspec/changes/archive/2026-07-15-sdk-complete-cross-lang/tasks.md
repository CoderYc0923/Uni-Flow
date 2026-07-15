## 1. C1 — Orchestrator from-yaml + bindings

- [x] 1.1 扩展 YAML 加载选项：bindings → 合成 HTTP registry 条目（复用 builtin.http / HttpAdapter）
- [x] 1.2 实现 `POST /workflows/from-yaml`（schema 校验、注册 metadata.id、结构化错误）
- [x] 1.3 TS 集成测试：成功注册、缺 binding、非法 YAML、注册后 sync run

## 2. C1/C2 — 远程 Unit 契约与 Schema fixture

- [x] 2.1 撰写远程 Unit JSON 契约文档（对齐 HttpAdapter）
- [x] 2.2 添加 HttpAdapter 黄金请求/响应 fixture 测试
- [x] 2.3 抽取共用 Schema valid/invalid fixture 目录供多语言 validate 对齐

## 3. C2 — Python / Java SDK YAML 表面

- [x] 3.1 Python：`validate`（共用 Schema）+ `load_and_register` + 文档化 run/sync
- [x] 3.2 Java：同等 API（轻量 Schema 校验 + HTTP）
- [x] 3.3 TS SDK/client：如需要则对齐 `from-yaml` 辅助方法
- [x] 3.4 SDK 单测：validate 矩阵；Orchestrator 可用时 register/run，不可用时连接错误

## 4. C3 — 三端轻量 demo

- [x] 4.1 共享 `examples/cross-lang/greeter.workflow.yaml`
- [x] 4.2 TS demo：起 Orchestrator、HTTP greeter（或 mock）、register、run
- [x] 4.3 Python demo：最小 HTTP Unit + SDK 全流程
- [x] 4.4 Java demo：最小 HTTP Unit + SDK 全流程
- [x] 4.5 启动脚本与 `examples/cross-lang/README` 三步说明

## 5. C4 — 文档与 P3 口子

- [x] 5.1 README/AGENTS：跨语言接入、`uses` 决策图、Registry 内存态、run 结果字段
- [x] 5.2 文档化 `artifacts` 预留键（透传、不实现）
- [x] 5.3 更新路线图表述（对照 SDK 完全体设计）

## 6. 验收与回归

- [x] 6.1 跑通 TS/Py/Java 对同一 YAML 的 validate + E2E（或记录脚本冒烟）
- [x] 6.2 `npm test` / `npm run typecheck` 全绿；进程内 YAML 回归不破
