## 1. Docs: TS complete path

- [x] 1.1 重写/调整 `guide/install.md` 与 `guide/quickstart.md`：自有 TS 项目依赖 `uni-flow`（npm 或 path/Git）+ 进程内 YAML
- [x] 1.2 写明单项目可不启 Orchestrator；Orchestrator 用于多进程/远程注册
- [x] 1.3 README / AGENTS 口径对齐「完整 Engine = TS」

## 2. Docs: TS↔TS Unit

- [x] 2.1 更新 `guide/cross-project.md`：主例改为 TS 父 + TS 子；能力边界框（无 Py/Java 完整 Engine）
- [x] 2.2 新增或扩写跟做小节（可并入 cross-project）：bindings、`/execute`、`params`、链 demo 命令
- [x] 2.3 更新示例索引/workflow-as-unit 文档页导语为两 TS 部署单元

## 3. Example polish

- [x] 3.1 打磨 `examples/workflow-as-unit/README.md`（父/子角色、端口、bindings、params）
- [x] 3.2（可选）导出 Wrapper 助手并让 child demo 使用；或保持单模块模板并在 README 标明复制点
- [x] 3.3 保持 `tests/workflow-as-unit-demo.test.ts` 通过；必要时补断言

## 4. Verify

- [x] 4.1 `npm run docs:build` 通过
- [x] 4.2 相关 vitest（含 workflow-as-unit）通过
