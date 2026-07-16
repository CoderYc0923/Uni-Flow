# Agent 约定

完整条文：仓库根 [`AGENTS.md`](https://github.com/CoderYc0923/Uni-Flow/blob/main/AGENTS.md)。  
人读叙事：[先懂它](../understand/what-it-solves.md) · [校验与约定](../hands-on/validate-agents.md)。

## 四条硬规矩

1. 拓扑改 YAML，不手写第二套调度器  
2. 领域能力用 `uses` 插件注册  
3. 禁止用 `for` / `while` 替代 ControlFlow  
4. 改 YAML 后跑 `uniflow validate`  

| Artifact | Path |
|----------|------|
| Schema | `schemas/uniflow.workflow.schema.json` |
| 文档站 | `docs-site/` + `mkdocs.yml` |
| Cursor 规则 | `.cursor/rules/uni-flow.mdc` |
