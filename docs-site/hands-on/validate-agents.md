# 校验与 Agent 约定

## validate

改完 YAML 拓扑后先校验（不执行 Agent）：

```bash
npm run build
npx uniflow validate ./examples/accounting-router.yaml
```

## 四条硬规矩（摘要）

完整条文：仓库根 [`AGENTS.md`](https://github.com/CoderYc0923/Uni-Flow/blob/main/AGENTS.md)

1. 拓扑改 YAML，不手写第二套调度器  
2. 领域能力用 `uses` 插件注册  
3. 禁止用 `for`/`while` 替代 ControlFlow  
4. 改 YAML 后跑 `uniflow validate`  

人读叙事从本站「先懂它」开始；AI 改代码以 AGENTS + `.cursor/rules/uni-flow.mdc` 为准。

## 关键路径

| 项 | 路径 |
|----|------|
| Schema | `schemas/uniflow.workflow.schema.json` |
| 模板 | `examples/templates/` |
| Cursor 规则 | `.cursor/rules/uni-flow.mdc` |
