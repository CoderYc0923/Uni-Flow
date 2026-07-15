## Why

Uni-Flow 已具备可运行的标准库（Engine、ControlFlow、Layer4、Orchestrator），但编排仍依赖代码 API；业务项目与 AI 工具缺少同一套可校验的 YAML 编排面，容易各写一套调度逻辑。按方案 3（双轨）设计，P0 应落地 Workflow YAML Schema、Loader、validate 与人/AI 约定，使编排拓扑可声明、可校验、可模板化。

## What Changes

- 新增 `uniflow.workflow.yaml` 的 **JSON Schema**（`apiVersion` / `kind` / `metadata` / `spec.units` / `spec.flow` / `spec.policy` 等）
- 新增 **YAML Loader**：校验后将声明映射为现有 `createWorkflowEngine` + ControlFlow + registry 插件解析
- 新增公开 API：`createEngineFromYaml(path|string, options)`（与代码路径共用同一 Engine）
- 新增 CLI：`npx uniflow validate <path>`（仅 Schema/结构校验，不执行）
- 新增插件注册约定：`uses: namespace.name` → `RuntimeAdapter` / Unit 工厂；内置 `builtin.mock` / `builtin.http`（其余 builtin 可 stub）
- 新增 Cursor/AGENTS 规则：拓扑只改 YAML、新能力走 `uses`、禁止手写第二套 ControlFlow、改完 validate
- 新增 `examples/templates/` 四类模板（qa / rag / vertical-transaction / media-pipeline）及至少一个可跑通示例 YAML
- 不在本变更实现：多语言 YAML 读取（P2）、记账项目 Wrapper 落地（P1）、强 builtin 路由语义扩展（P3）

## Capabilities

### New Capabilities

- `workflow-yaml`: Workflow YAML 文档模型、JSON Schema 与校验规则
- `yaml-loader`: 从 YAML 加载并构造可运行 Engine（含 registry / uses 解析）
- `uniflow-validate-cli`: validate CLI 的行为与出口约定
- `uniflow-ai-conventions`: Cursor/AGENTS 规则与示例模板对 AI/人类的约束

### Modified Capabilities

（无 — 现有运行时 capability 行为不变；YAML 路径复用既有 Engine/Policy，不改其 REQUIREMENTS）

## Impact

- 新增：`schemas/uniflow.workflow.schema.json`、`src/yaml/`（或等价模块）、package bin `uniflow`
- 新增：`.cursor/rules/uni-flow.mdc` 和/或 `AGENTS.md` 相关段落、`examples/templates/*.yaml`
- 更新：`src/index.ts` 导出、`README.md` YAML/P0 落地说明、依赖（如 `yaml` / JSON Schema 校验库）
- 不影响：现有代码 API `createWorkflowEngine` 的兼容性；不引入破坏性 API 变更
