# 快速开始

在 **自有 TypeScript 项目** 中依赖 `uni-flow` 后，用进程内 Engine 跑编排。  
**不需要** Orchestrator HTTP，也不调用真实 LLM（本页用 Mock）。

> 安装方式见 [安装](/guide/install)。完整 Engine 目前仅 TS。

## 路径 A：代码 API（Sequential Mock）

两个 Unit：`research` → `write`。

```typescript
import {
  createWorkflowEngine,
  createSharedState,
  SequentialFlow,
  createMockAdapter,
  DEFAULT_CONTEXT_POLICY,
} from 'uni-flow';
import type { WorkflowUnit } from 'uni-flow';

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
  console.log(result.completedUnits, result.state['output.write']);
}

main();
```

本仓库对照：[`examples/sequential-pipeline.ts`](https://github.com/CoderYc0923/Uni-Flow/blob/main/examples/sequential-pipeline.ts)。

## 路径 B：YAML（推荐拓扑）

```typescript
import { createEngineFromYaml } from 'uni-flow';

const engine = await createEngineFromYaml(`
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
`);

const result = await engine.run({ task: 'hello' });
console.log(result.state['output.b']);
```

编辑后校验：`npx uniflow validate path/to.yaml`（Schema only）。详见 [YAML 与 validate](/guide/yaml)。

## 返回值（`WorkflowResult`）

| 字段 | 说明 |
|------|------|
| `runId` | 运行 ID |
| `completedUnits` | 已完成 Unit |
| `state` | 含 `output.<unitId>` 等 |
| `duration` / `tokenUsage` / `cost` | 耗时与计量 |

## 下一步

- 把另一个 **TS** 项目当 Unit：[跨项目复用](/guide/cross-project)
- 注册真实插件：[uses 与插件](/guide/uses)
- 需要 HTTP 注册/远程启 run 时再启 Orchestrator（[安装](/guide/install) 中的场景表）
