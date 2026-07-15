# YAML 编排

Schema：[`schemas/uniflow.workflow.schema.json`](https://github.com/OWNER/Uni-Flow/blob/main/schemas/uniflow.workflow.schema.json)  
模板：[`examples/templates/`](https://github.com/OWNER/Uni-Flow/tree/main/examples/templates)  
约定：[`AGENTS.md`](https://github.com/OWNER/Uni-Flow/blob/main/AGENTS.md)、[`.cursor/rules/uni-flow.mdc`](https://github.com/OWNER/Uni-Flow/blob/main/.cursor/rules/uni-flow.mdc)

## 示例：Router 工作流

```yaml
apiVersion: uniflow/v1
kind: Workflow
metadata:
  id: accounting-chat
spec:
  policy:
    budget: { maxTokens: 80000 }
  units:
    - id: router
      uses: builtin.mock
      config: { route: record, response: record }
    - id: record
      uses: accounting.record
    - id: general
      uses: accounting.chat
  flow:
    type: router
    routerUnit: router
    routes:
      record: record
      general: general
```

## 加载与运行

```typescript
import { createEngineFromYaml } from 'uni-flow';

const engine = await createEngineFromYaml('./uniflow.workflow.yaml', {
  registry: {
    'accounting.record': recordAdapter, // RuntimeAdapter 或工厂
    'accounting.chat': chatAdapter,
  },
});
await engine.run({ task: userMessage });
```

可运行示例：`examples/yaml-sequential.yaml`（全部 `builtin.mock`）。

代码 API `createWorkflowEngine` 仍保留，与 YAML 共用同一 Engine（复合拓扑 YAML v1 表达不了时可用代码子图）。

## Orchestration 纪律

1. 拓扑改 YAML，不要手写第二套调度器  
2. 领域能力 → `uses` 插件并注册  
3. 改完跑 [`validate`](validate.md)  
