# YAML 与 validate

Uni-Flow 推荐用 **Workflow YAML**（`apiVersion: uniflow/v1`）描述拓扑，而非在应用代码里手写调度循环。

## 最小 YAML 示例

```yaml
apiVersion: uniflow/v1
kind: Workflow
metadata:
  id: yaml-sequential-example
  description: Sequential 示例（builtin.mock）
spec:
  policy:
    timeout:
      unitMs: 120000
      workflowMs: 600000
    budget:
      maxTokens: 80000
      maxCost: 2
  units:
    - id: research
      uses: builtin.mock
      config:
        response: "researched notes"
    - id: write
      uses: builtin.mock
      config:
        response: "written draft"
  flow:
    type: sequential
    order: [research, write]
```

仓库文件：[`examples/yaml-sequential.yaml`](https://github.com/CoderYc0923/Uni-Flow/blob/main/examples/yaml-sequential.yaml)。

## CLI 校验

编辑 YAML 后 **必须** 运行 validate（仅 Schema，不解析插件、不执行工作流）：

```bash
npm run build
npx uniflow validate examples/yaml-sequential.yaml
# 或
npm run uniflow -- validate examples/yaml-sequential.yaml
```

成功输出示例：

```text
OK: .../yaml-sequential.yaml (workflow id: yaml-sequential-example)
```

失败时打印 `YamlValidationError` 详情（路径 + 消息）。

## 进程内加载：createEngineFromYaml

```typescript
import { createEngineFromYaml } from 'uni-flow';

const engine = await createEngineFromYaml('examples/yaml-sequential.yaml');
const result = await engine.run({ task: 'demo' });

console.log(result.completedUnits);
console.log(result.state['output.write']);
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `source` | `string` | 是 | YAML 文件路径，或内联 YAML 字符串 |
| `options.registry` | `UnitPluginRegistry` | 否 | 自定义 `uses` 插件注册表 |
| `options.bindings` | `UsesBindings` | 否 | HTTP 远程 Unit 绑定（见 [uses 与插件](/guide/uses)） |
| `options.engineOptions` | `WorkflowEngineOptions` | 否 | 转发给 `createWorkflowEngine` 的 Layer4 选项 |

## 远程注册：Orchestrator

跨进程 / 跨语言场景通过 HTTP 注册，见 [POST /workflows/from-yaml](/reference/http/from-yaml) 与 [跨语言](/guide/cross-lang)。

## Schema 位置

JSON Schema：[`schemas/uniflow.workflow.schema.json`](https://github.com/CoderYc0923/Uni-Flow/blob/main/schemas/uniflow.workflow.schema.json)

也可通过包导出引用：

```typescript
import schema from 'uni-flow/schemas/uniflow.workflow.schema.json';
```

## 下一步

- [uses 与插件](/guide/uses) — 如何挂载 Agent
- [YAML API 参考](/reference/yaml-api)
