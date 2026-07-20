# 快速开始

本页假设你已完成 [安装](/guide/install)，并能 `import` `uni-flow`。  
我们用 **Mock（假模型）**，不需要 API Key，也不需要启动 Orchestrator。

## 你将完成什么

跑通一条「两个步骤依次执行」的迷你工作流，并在终端看到：

- 哪些 Unit 完成了（`completedUnits`）
- 某个 Unit 写进共享状态的输出（如 `output.write`）

## 30 秒术语（先读再写代码）

| 词 | 白话 |
|----|------|
| **Unit** | 工作流里的一个步骤（一个「工人」）。每个 Unit 有 id，负责一次推理/调用。 |
| **ControlFlow** | 规定 Unit **谁先谁后**（顺序、并行、路由…）。入门只用 **Sequential（依次）**。 |
| **SharedState** | 步骤之间共享的黑板；常见键是 `task`、`output.<unitId>`。 |
| **RuntimeAdapter** | Unit 真正「怎么执行」的适配器。入门用 **Mock**，假装成模型返回固定文本。 |
| **Engine** | 读入拓扑 + 状态，按 ControlFlow 把 Unit 跑完，返回 `WorkflowResult`。 |

## 选哪条轨道？

| 轨道 | 适合谁 | 建议 |
|------|--------|------|
| **A：代码 API** | 想先看清 Unit / Flow 对象 | **新手先做 A** |
| **B：YAML** | 想把拓扑写进配置文件（推荐长期做法） | 做完 A 再做 B |

---

## 路径 A：代码 API（Sequential + Mock）

### A1. 创建文件

在应用里新建 `quickstart-a.ts`。

### A2. 粘贴完整代码

```typescript
import {
  createWorkflowEngine,
  createSharedState,
  SequentialFlow,
  createMockAdapter,
  DEFAULT_CONTEXT_POLICY,
} from 'virtual-uni-flow';
import type { WorkflowUnit } from 'virtual-uni-flow';

/** 造一个假 Unit：读 SharedState 的 task，写出 output.<id> */
function makeUnit(id: string, prefix: string): WorkflowUnit {
  return {
    id,
    runtime: createMockAdapter({
      responseFn: (input) => ({
        content: `${prefix}: ${input.task}`,
        toolCalls: [],
        stopReason: 'stop',
        metadata: {},
        tokenUsage: {
          promptTokens: 5,
          completionTokens: 10,
          totalTokens: 15,
          estimatedCost: 0.001,
        },
      }),
    }),
    terminationPolicy: { type: 'stop-reason', reasons: ['stop'] },
    inputAdapter: (state) => ({
      task: (state.get<string>('task') as string) ?? id,
    }),
    outputAdapter: (output, state) => {
      state.set(`output.${id}`, output.content);
    },
    contextPolicy: DEFAULT_CONTEXT_POLICY,
  };
}

async function main() {
  const research = makeUnit('research', 'researched');
  const write = makeUnit('write', 'written');

  const engine = createWorkflowEngine({
    workflowId: 'sequential-pipeline',
    units: new Map([
      ['research', research],
      ['write', write],
    ]),
    controlFlow: new SequentialFlow([research, write]),
    sharedState: createSharedState(),
  });

  const result = await engine.run({ task: '写一篇 Uni-Flow 简介' });
  console.log('completedUnits =', result.completedUnits);
  console.log('output.write =', result.state['output.write']);
}

main();
```

这段代码在做什么（对照术语）：

1. 两个 Unit：`research` → `write`（顺序由 `SequentialFlow` 决定）
2. `engine.run({ task: '...' })` 把 `task` 写入 SharedState，再开跑
3. 每个 Unit 的 `outputAdapter` 把模型输出写到 `output.<id>`

### A3. 运行

```bash
npx tsx quickstart-a.ts
```

### A4. 预期结果

大致类似（文字可略有不同）：

```text
completedUnits = [ 'research', 'write' ]
output.write = written: 写一篇 Uni-Flow 简介
```

若 `completedUnits` 只有一个或报错：检查是否漏了 `SequentialFlow` 的顺序，以及两个 Unit 是否都放进了 `units` Map。

本仓库对照实现：[`examples/sequential-pipeline.ts`](https://github.com/CoderYc0923/Uni-Flow/blob/main/examples/sequential-pipeline.ts)。

---

## 路径 B：YAML（推荐拓扑写法）

拓扑（有哪些 Unit、什么顺序）写在 YAML 里；应用代码只负责加载与 `run`。

### B1. 创建 YAML 文件

新建 `quickstart.workflow.yaml`：

```yaml
apiVersion: uniflow/v1
kind: Workflow
metadata:
  id: qs-yaml
spec:
  units:
    - id: a
      uses: builtin.mock
      config: { response: "first" }
    - id: b
      uses: builtin.mock
      config: { response: "second" }
  flow:
    type: sequential
    order: [a, b]
```

- `uses: builtin.mock`：内置假模型，无需自写 Adapter
- `flow.order`：执行顺序

### B2. 加载并运行

新建 `quickstart-b.ts`（与 YAML 同目录，或改路径）：

```typescript
import { createEngineFromYaml } from 'virtual-uni-flow';

async function main() {
  const engine = await createEngineFromYaml('./quickstart.workflow.yaml');
  const result = await engine.run({ task: 'hello' });
  console.log('completedUnits =', result.completedUnits);
  console.log('output.b =', result.state['output.b']);
}

main();
```

也可把 YAML 写成**内联字符串**传给 `createEngineFromYaml`（适合演示；真实项目更推荐文件）。

### B3. 运行

```bash
npx tsx quickstart-b.ts
```

### B4. 预期结果

```text
completedUnits = [ 'a', 'b' ]
output.b = second
```

（具体 `output.*` 内容取决于 mock 的 `config.response` 与默认 output 映射。）

### B5. 改完 YAML 先校验（强烈建议）

在 **Uni-Flow 本仓**（或已能调用 CLI 的环境）：

```bash
npx uniflow validate ./quickstart.workflow.yaml
```

成功示例：

```text
OK: .../quickstart.workflow.yaml (workflow id: qs-yaml)
```

详情：[YAML 与 validate](/guide/yaml)。

---

## 返回值里看什么？

`engine.run` 返回的 `WorkflowResult` 常用字段：

| 字段 | 说明 |
|------|------|
| `runId` | 这次运行的 ID |
| `completedUnits` | 已完成的 Unit id 列表 |
| `state` | SharedState 快照，含 `output.<unitId>` 等 |
| `duration` / `tokenUsage` / `cost` | 耗时与计量（Mock 也会填小数） |

## 常见问题

| 现象 | 处理 |
|------|------|
| 找不到 YAML 文件 | 用绝对路径，或确认 `tsx` 的当前工作目录 |
| `uses` 未知插件 | 入门只用 `builtin.mock`；自定义见 [uses 与插件](/guide/uses) |
| 想接真模型 | 先跑通 Mock，再换 RuntimeAdapter / 自研 `uses` 插件 |

## 下一步

1. 从空文件把 YAML 字段过一遍 → [YAML 与 validate](/guide/yaml)
2. 把另一个 TS 服务当成一个 Unit → [跨项目复用](/guide/cross-project)
3. 查函数参数 → [YAML API](/reference/yaml-api) / [Engine](/reference/engine) / [生成附录说明](/reference/typedoc-appendix)
