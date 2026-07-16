# 最小可跑（Mock）

无需 API Key。用 Mock Adapter 验证「引擎真的在调度」。

## 代码路径（Sequential）

完整文件：[`examples/sequential-pipeline.ts`](https://github.com/CoderYc0923/Uni-Flow/blob/main/examples/sequential-pipeline.ts)

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

const a = makeUnit('research', 'researched');
const b = makeUnit('write', 'written');
const engine = createWorkflowEngine({
  workflowId: 'quickstart',
  units: new Map([['research', a], ['write', b]]),
  controlFlow: new SequentialFlow([a, b]),
  sharedState: createSharedState(),
});
const result = await engine.run({ task: 'hello' });
console.log(result.completedUnits); // ['research', 'write']
```

## YAML 路径（Sequential）

```bash
npm run build
npx uniflow validate ./examples/yaml-sequential.yaml
npx tsx examples/run-yaml-sequential.ts
```

文件：[`examples/yaml-sequential.yaml`](https://github.com/CoderYc0923/Uni-Flow/blob/main/examples/yaml-sequential.yaml)

## 下一步

要看**意图分流**（更贴近记账）：[记账路由怎么接](accounting-router.md)
