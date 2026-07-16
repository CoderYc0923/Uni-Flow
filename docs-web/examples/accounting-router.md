# 记账意图分流

本示例演示 **Router 控制流**：用户输入经意图识别 Unit 分流到「记账」或「闲聊」分支。全程使用 `builtin.mock`，无需真实 LLM。

## 业务故事

用户说：「午饭 32 块」→ 系统识别为 **record** 意图 → 记账 Unit 返回 `recorded: lunch 32`。

用户说：「今天天气怎么样」→ 识别为 **general** → 闲聊 Unit 返回 `chatted`。

## 工作流 YAML

文件：[`examples/accounting-router.yaml`](https://github.com/CoderYc0923/Uni-Flow/blob/main/examples/accounting-router.yaml)

```yaml
apiVersion: uniflow/v1
kind: Workflow
metadata:
  id: accounting-router-demo
  description: Mock intent router → record | general (accounting spine demo)
spec:
  policy:
    timeout:
      unitMs: 120000
      workflowMs: 600000
    budget:
      maxTokens: 80000
      maxCost: 2
  units:
    - id: intent-router
      uses: builtin.mock
      config:
        route: record
        response: record
    - id: record
      uses: builtin.mock
      config:
        response: "recorded: lunch 32"
    - id: general
      uses: builtin.mock
      config:
        response: "chatted"
  flow:
    type: router
    routerUnit: intent-router
    routes:
      record: record
      general: general
```

## 拓扑说明

```text
                    ┌─────────────────┐
                    │  intent-router  │
                    └────────┬────────┘
                             │
              route=record   │   route=general
                    ┌────────┴────────┐
                    ▼                 ▼
              ┌──────────┐      ┌──────────┐
              │  record  │      │  general │
              └──────────┘      └──────────┘
```

| Unit | uses | 作用 |
|------|------|------|
| `intent-router` | `builtin.mock` | 输出 `metadata.route`（Mock 从 `config.route` 注入） |
| `record` | `builtin.mock` | 记账分支固定响应 |
| `general` | `builtin.mock` | 闲聊分支固定响应 |

Router 从 router Unit 的 `AgentOutput.metadata.route`（或 SharedState 的 `route`）读取路由键，映射到 `routes` 表中的目标 Unit。

## 运行

```bash
npm run build
npx uniflow validate examples/accounting-router.yaml
```

进程内执行：

```typescript
import { createEngineFromYaml } from 'uni-flow';

const engine = await createEngineFromYaml('examples/accounting-router.yaml');
const result = await engine.run({ task: '午饭 32 块' });

console.log('completedUnits:', result.completedUnits);
console.log('output.record:', result.state['output.record']);
// 或 output.general，取决于 mock route 配置
```

## 扩展思路

- 将 `intent-router` 的 `uses` 换为真实 Agent 插件，由模型返回 `route` 字段。
- 在 Orchestrator 上 `POST /workflows/from-yaml` 注册后，用 SDK 远程触发运行。

## 相关文档

- [ControlFlow — RouterFlow](/reference/controlflow)
- [uses 与插件](/guide/uses)
