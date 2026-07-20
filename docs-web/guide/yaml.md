# YAML 与 validate

本页接在 [快速开始](/guide/quickstart) 路径 B 之后：从**空文件**写出一份可跑的 Sequential YAML，学会校验，再在进程内加载执行。

## 你将完成什么

1. 手写一份 `apiVersion: uniflow/v1` 的 Workflow YAML  
2. 用 `uniflow validate` 确认 Schema 通过  
3. 用 `createEngineFromYaml` 跑通，并看到 `completedUnits`

## 为什么用 YAML？

Uni-Flow 约定：**拓扑（有哪些 Unit、怎么连）写在 YAML**，应用代码负责插件注册与 `run`。  
不要在业务代码里用 `for`/`while` 自己调度多个 Agent——那会绕过 ControlFlow。

## 步骤 1：新建空文件

创建 `my-first.workflow.yaml`，先只写「外壳」：

```yaml
apiVersion: uniflow/v1
kind: Workflow
metadata:
  id: my-first
spec:
  units: []
  flow:
    type: sequential
    order: []
```

| 字段 | 含义 |
|------|------|
| `apiVersion` / `kind` | 固定为 `uniflow/v1` + `Workflow`（入门不要改） |
| `metadata.id` | 工作流名字，校验成功时会打印出来 |
| `spec.units` | Unit 列表（步骤） |
| `spec.flow` | 控制流；入门用 `sequential` + `order` |

## 步骤 2：加两个 Mock Unit

把 `units` / `order` 填成：

```yaml
apiVersion: uniflow/v1
kind: Workflow
metadata:
  id: my-first
  description: 我的第一个 Sequential
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

对照理解：

| 片段 | 白话 |
|------|------|
| `id: research` | 这个步骤叫 research |
| `uses: builtin.mock` | 用内置假模型（无需 registry） |
| `config.response` | Mock 返回的固定文案 |
| `order: [research, write]` | 先 research 再 write |

仓库完整对照：[`examples/yaml-sequential.yaml`](https://github.com/CoderYc0923/Uni-Flow/blob/main/examples/yaml-sequential.yaml)。

## 步骤 3：校验（必做）

`validate` **只检查 JSON Schema**（字段名、类型、必填等），**不会**解析你的业务插件，也**不会**真正执行工作流。

在已 build 的 Uni-Flow 环境，或能调用到 CLI 的项目中：

```bash
# 若在本仓
npm run build
npx uniflow validate my-first.workflow.yaml
```

### 预期成功

```text
OK: .../my-first.workflow.yaml (workflow id: my-first)
```

### 预期失败时你该看什么

终端会打印 `YamlValidationError`：哪条路径、什么错。常见坑：

| 错误原因 | 改法 |
|----------|------|
| `order` 里的 id 在 `units` 里不存在 | 两边 id 拼写一致 |
| 漏了 `apiVersion` / `kind` | 按上文外壳补全 |
| `flow.type` 写成未知类型 | 入门只用 `sequential` |

## 步骤 4：进程内加载并跑

```typescript
import { createEngineFromYaml } from 'uni-flow';

async function main() {
  const engine = await createEngineFromYaml('./my-first.workflow.yaml');
  const result = await engine.run({ task: 'demo' });

  console.log('completedUnits =', result.completedUnits);
  console.log('output.write =', result.state['output.write']);
}

main();
```

```bash
npx tsx run-my-first.ts
```

### 预期结果

```text
completedUnits = [ 'research', 'write' ]
```

`output.write` 应能看到与 mock 相关的内容（具体字符串取决于默认 output 映射与 config）。

### `createEngineFromYaml` 参数（入门版）

| 参数 | 必填 | 说明 |
|------|------|------|
| `source` | 是 | 文件路径，或内联 YAML 字符串 |
| `options.registry` | 否 | 自定义 `uses` → 插件；入门可省略 |
| `options.bindings` | 否 | 远程 HTTP Unit；跨项目时再用 |
| `options.engineOptions` | 否 | Layer4 等高级选项 |

完整字段表：[YAML API](/reference/yaml-api) · 符号注解：[生成附录](/reference/generated/)（见 [说明](/reference/typedoc-appendix)）。

## 步骤 5（可选）：远程注册 Orchestrator

只有跨进程、要用 HTTP 启 run 时才需要。见 [POST /workflows/from-yaml](/reference/http/from-yaml)。  
单机入门**跳过**本步。

## Schema 在哪？

- 文件：[`schemas/uniflow.workflow.schema.json`](https://github.com/CoderYc0923/Uni-Flow/blob/main/schemas/uniflow.workflow.schema.json)
- 代码：

```typescript
import schema from 'uni-flow/schemas/uniflow.workflow.schema.json';
```

## 常见问题

| 问题 | 答案 |
|------|------|
| validate 过了但 run 失败？ | Schema ≠ 插件存在；自定义 `uses` 必须进 `registry` |
| 可以手写多 Agent 循环代替 YAML 吗？ | 不要；拓扑留在 YAML / ControlFlow |
| 下一步如何挂真实 Agent？ | [uses 与插件](/guide/uses) |

## 下一步

- 把另一 TS 项目嵌成一个 Unit → [跨项目复用](/guide/cross-project)
- 插件与 bindings → [uses 与插件](/guide/uses)
