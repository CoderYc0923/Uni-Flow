# 快速开始

本节用 **Mock Sequential** 流水线演示进程内编排：不依赖 Orchestrator HTTP，也不调用真实 LLM。

## 目标

两个 Unit 顺序执行：`research` → `write`，结果写入 `SharedState` 的 `output.<unitId>`。

## 完整示例

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

  console.log('runId:', result.runId);
  console.log('completedUnits:', result.completedUnits);
  console.log('output.write:', result.state['output.write']);
}

main();
```

仓库内对应文件：[`examples/sequential-pipeline.ts`](https://github.com/CoderYc0923/Uni-Flow/blob/main/examples/sequential-pipeline.ts)。

## 运行方式

```bash
npm run build
npx tsx examples/sequential-pipeline.ts
```

## 返回值说明

`engine.run()` 返回 `WorkflowResult`：

| 字段 | 类型 | 说明 |
|------|------|------|
| `runId` | `string` | 本次运行 ID |
| `completedUnits` | `string[]` | 已完成的 Unit ID 列表 |
| `state` | `Record<string, unknown>` | 共享状态快照（含 `output.*`） |
| `messages` | `WorkflowMessage[]` | 运行期消息（含 HITL 等） |
| `duration` | `number` | 耗时（毫秒） |
| `tokenUsage` | `number` | 累计 token |
| `cost` | `number` | 累计估算成本 |

## 下一步

- 声明式 YAML 路径：[YAML 与 validate](/guide/yaml)
- API 详情：[Engine 参考](/reference/engine)
