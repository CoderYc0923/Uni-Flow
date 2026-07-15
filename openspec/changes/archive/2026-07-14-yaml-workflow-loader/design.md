## Context

Uni-Flow 已具备进程内 Engine、七种 ControlFlow、Layer4 横切与 Orchestrator。文档与方案 3（`docs/superpowers/specs/2026-07-14-uniflow-standard-library-yaml-design.md`）已将 **YAML 定为编排真源、代码为插件面**，但运行时尚未提供 Schema、Loader、validate 与 AI 规则。本变更实现 P0，使新项目可通过 YAML + `uses` 注册跑通同一套语义。

约束：

- 复用现有 `createWorkflowEngine` / ControlFlow / Policy，禁止第二套执行语义
- 保持代码 API 可用（测试、Composite 边角、渐进迁移）
- v1 Schema 先覆盖设计文档 MUST 字段；表达力不足时回退代码路径

## Goals / Non-Goals

**Goals:**

- 定义并发布 `schemas/uniflow.workflow.schema.json`（`apiVersion: uniflow/v1`）
- 实现 `createEngineFromYaml`：parse → schema validate → resolve `uses` → 构造 Units + ControlFlow → `createWorkflowEngine`
- 提供 `uniflow validate` CLI（成功 exit 0，失败非 0 + 可读错误）
- 提供 Cursor/AGENTS 约定与 `examples/templates/` 四类模板 + 至少 1 个可执行示例

**Non-Goals:**

- 不在 YAML 写入 Prompt/SQL/密钥/领域规则表
- 不落地 accounting-tool Wrapper（P1）
- 不做 Python/Java YAML Loader（P2）
- 不实现完整 `builtin.llm-router` 的 LLM 推理（可提供规则/状态路由 stub 或依赖插件配置）
- 不做 per-plugin JSON Schema 扩展注册（开放问题，P0 仅透传 `config`）

## Decisions

### D1: YAML 为编排真源，Loader 只做映射

- **选择：** Loader 将 YAML 映射到既有 TypeScript 构造路径，不引入并行 Engine。
- **备选：** 独立 YAML 解释执行器 → 否决（双实现、语义漂移）。
- **理由：** 方案 3 明确 dual-track 共用同一底座。

### D2: Schema 位置与版本

- **选择：** 仓库根（或 `schemas/`）发布 `uniflow.workflow.schema.json`；文档字段 `apiVersion: uniflow/v1`，不识别版本则拒绝加载。
- **备选：** 仅在运行时内嵌 Schema → 否决（AI/编辑器无法直接引用）。
- **理由：** IDE `$schema`、CLI、CI 门禁共用同一文件。

### D3: `uses` 解析与 registry

- **选择：** `createEngineFromYaml(source, { registry })`，`registry[uses]` 为插件工厂或已构造 Adapter；内置命名空间 `builtin.*` 由引擎注册表提供默认实现（P0：`builtin.mock` 必做，`builtin.http` 可选最小实现）。
- **备选：** YAML 内嵌可执行脚本 → 否决（安全与不可校验）。
- **理由：** 声明与实现分离；缺失 `uses` 时 fail-fast。

### D4: Flow 映射策略（v1）

| YAML `flow.type` | 映射 |
|------------------|------|
| sequential | SequentialFlow + units 顺序（或显式 `order`） |
| parallel | ParallelFlow |
| router | RouterFlow（`routerUnit` + `routes`） |
| loop | LoopFlow |
| dag | DAGFlow（依赖边） |
| delegation | DelegationFlow |
| composite | P0：若无法纯声明，校验报「请用代码 API」或仅支持受限嵌套 |

- **理由：** 先覆盖主路径；Composite 边角保留代码路径（设计文档开放项）。

### D5: Policy / contextPolicy

- **选择：** `spec.policy` → Engine/Policy 默认配置；unit 级 `policyOverrides` / `contextPolicy` 透传到 `WorkflowUnit` 构造。
- **备选：** YAML 另写一套策略语言 → 否决。

### D6: CLI 形态

- **选择：** package.json `bin.uniflow` → `dist/cli/uniflow.js`；子命令 `validate <file>`；本地可用 `node`/`npx`。
- **备选：** 仅导出库函数无 CLI → 否决（AI rules 要求改完 validate）。

### D7: 依赖

- **选择：** `yaml`（parse）+ `ajv`（JSON Schema 校验）；均为正式 dependency。
- **备选：** 手写校验 → 否决（易漂移）；仅 YAML 1.1 特例解析 → 超出 P0。

### D8: AI 约定工件

- **选择：** `.cursor/rules/uni-flow.mdc`（强制条文）+ `AGENTS.md` 简短指针（若仓库尚无则创建段落）；模板放 `examples/templates/`。
- **理由：** Cursor 与通用 Agent 工具双覆盖。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| YAML 表达力不足（复杂 Composite） | 保留代码 API；Schema/错误信息明确引导 |
| AI 仍手写第二套调度 | rules + validate；示例对比展示 |
| registry 漏注册导致运行时才失败 | Loader 在 load 阶段校验所有 `uses` 均已解析 |
| Schema 与 TS 类型漂移 | 单源 Schema + 加载测试用例覆盖；后续可考虑 codegen |
| Router 路由键提取语义不清 | P0：约定 router Unit 写入 SharedState 约定键（如 `route`）；YAML 表达式延后 |

## Migration Plan

1. 合并本变更后，现有代码调用方零改动。
2. 新示例/模板默认 YAML 路径；README「未来规划」P0 标为已落地。
3. 回滚：移除 bin/Schema/Loader 导出即可；不触及核心 Engine 数据兼容性。

## Open Questions

- Router：`routeExtractor` YAML 表达式 vs 仅 SharedState（P0 采用后者）
- 是否为每个插件挂扩展 JSON Schema（延后）
- 发布包名对外文档用 `uni-flow`（与 package.json 一致）
