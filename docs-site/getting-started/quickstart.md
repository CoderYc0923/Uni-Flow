# 快速开始

无需 API Key：用 `createMockAdapter` 即可跑通编排。

## 方式 A：代码 API（Sequential）

```typescript
import {
  createWorkflowEngine,
  createSharedState,
  SequentialFlow,
  createMockAdapter,
  DEFAULT_CONTEXT_POLICY,
} from 'uni-flow'; // 或 './src/index.js'
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
  units: new Map([
    ['research', a],
    ['write', b],
  ]),
  controlFlow: new SequentialFlow([a, b]),
  sharedState: createSharedState(),
});

const result = await engine.run({ task: '写一篇 Uni-Flow 简介' });
console.log(result.completedUnits); // ['research', 'write']
```

完整文件：[`examples/sequential-pipeline.ts`](https://github.com/OWNER/Uni-Flow/blob/main/examples/sequential-pipeline.ts)。

换真实模型：将 Mock 换成 `createPiAgentAdapter` / `createHttpAdapter` / `createMcpAdapter`。

## 方式 B：YAML + 插件注册

```yaml
# 见 examples/yaml-sequential.yaml（可全部使用 builtin.mock）
apiVersion: uniflow/v1
kind: Workflow
metadata:
  id: demo-sequential
spec:
  units:
    - id: step-a
      uses: builtin.mock
    - id: step-b
      uses: builtin.mock
  flow:
    type: sequential
    units: [step-a, step-b]
```

```typescript
import { createEngineFromYaml } from 'uni-flow';

const engine = await createEngineFromYaml('./uniflow.workflow.yaml', {
  registry: {
    // 'my.plugin': adapterOrFactory,
  },
});
await engine.run({ task: 'hello' });
```

先校验再执行：

```bash
npm run build
npx uniflow validate ./examples/yaml-sequential.yaml
```

更多 YAML 说明见 [YAML 编排](../orchestration/yaml.md)。

## 下一步

- [核心概念](concepts.md)
- [执行管线](../concepts/pipeline.md)
- [跨语言](../orchestration/cross-lang.md)
