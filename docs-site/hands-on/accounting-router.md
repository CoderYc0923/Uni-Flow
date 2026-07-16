# 记账路由怎么接

目标：用 YAML 声明「Router → record | general」，全部 `builtin.mock`，先跑通分流再换真插件。

## 可运行示例

仓库文件：[`examples/accounting-router.yaml`](https://github.com/CoderYc0923/Uni-Flow/blob/main/examples/accounting-router.yaml)  
（与模板 [`examples/templates/vertical-transaction.yaml`](https://github.com/CoderYc0923/Uni-Flow/blob/main/examples/templates/vertical-transaction.yaml) 同构，精简为演示。）

```yaml
apiVersion: uniflow/v1
kind: Workflow
metadata:
  id: accounting-router-demo
spec:
  units:
    - id: intent-router
      uses: builtin.mock
      config:
        route: record          # Mock 固定走出 record；真路由换成真实 Adapter
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

校验：

```bash
npm run build
npx uniflow validate ./examples/accounting-router.yaml
```

加载（TS）：

```typescript
import { createEngineFromYaml } from 'uni-flow';

const engine = await createEngineFromYaml('./examples/accounting-router.yaml');
const result = await engine.run({ task: '午饭 32' });
// completedUnits 含 intent-router 与 record（Mock 固定 route: record）
```

## 换成真实记账

| 步骤 | 做什么 |
|------|--------|
| 1 | 实现 `accounting.record` Adapter（解析金额、写库） |
| 2 | 实现路由 Adapter（模型或规则产出 `record` / `general`） |
| 3 | YAML 里 `uses: accounting.record`，`createEngineFromYaml({ registry })` 注册 |
| 4 | 再跑 `uniflow validate` |

| 设计理由 | 仓库现状 |
|----------|----------|
| 拓扑与插件分离：换模型不必改排班 YAML | ✅ Loader + registry；🟡 仓内无生产记账插件，只有 Mock/模板 |

## 若你只记住一件事

**先 Mock 证明分流，再挂真 `uses`。** 不要一上来在业务里手写第二套调度器。

下一页：[校验与 Agent 约定](validate-agents.md)
