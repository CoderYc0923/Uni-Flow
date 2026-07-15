# validate

在执行工作流前，用 CLI 做 Schema / 结构校验（不跑 Agent）。

## 命令

```bash
npm run build
npx uniflow validate ./uniflow.workflow.yaml
# 或
node dist/cli/uniflow.js validate ./examples/yaml-sequential.yaml
```

## 何时必须跑

- 编辑 `units` / `flow` / `policy` / routes / DAG edges 之后  
- PR 或本地改 YAML 模板之后  
- AI 编程工具生成 Workflow YAML 之后  

详见仓库 [`AGENTS.md`](https://github.com/OWNER/Uni-Flow/blob/main/AGENTS.md) 与 [Agent 约定](../reference/agents.md)。

## 程序化校验

TS：`validateWorkflowYamlSource` / Loader 入口（见 [API 速查](../reference/api.md)）。  
Python / Java SDK：提供结构校验与 `load_and_register` 等表面（见 [跨语言](cross-lang.md)）。
