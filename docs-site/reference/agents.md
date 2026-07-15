# Agent 约定

完整条文以仓库根 [`AGENTS.md`](https://github.com/OWNER/Uni-Flow/blob/main/AGENTS.md) 为准。摘要如下。

## Orchestration（YAML-first）

1. 改拓扑 → Workflow YAML（`apiVersion: uniflow/v1`），不要第二套手写调度器  
2. 新领域能力 → `uses` 插件并注册（`createEngineFromYaml` registry 或 Orchestrator `bindings`）  
3. 禁止用 `for` / `while` 替代 ControlFlow / YAML  
4. 改 YAML 后跑 `uniflow validate`  

## 关键路径

| Artifact | Path |
|----------|------|
| JSON Schema | `schemas/uniflow.workflow.schema.json` |
| Loader | `src/yaml/` → `createEngineFromYaml` |
| CLI | `dist/cli/uniflow.js` |
| Templates | `examples/templates/` |
| Cursor rule | `.cursor/rules/uni-flow.mdc` |
| 文档站源 | `docs-site/` + 根 `mkdocs.yml` |

## Dual-track

- **YAML path**：新编排默认  
- **Code path**：`createWorkflowEngine` 用于测试与 Composite 边角；同一 Engine/Layer4  
