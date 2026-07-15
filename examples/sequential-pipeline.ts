/**
 * 案例 A：Sequential 流水线（进程内）
 *
 * 用法（在仓库根目录，需已安装依赖）:
 *   npx vitest run --testNamePattern sequential  # 或自行 import 本文件后 await runSequentialPipeline()
 *
 * 对应 README「快速开始 / 完整案例 A」。
 */
import {
  createWorkflowEngine,
  createSharedState,
  SequentialFlow,
  createMockAdapter,
  DEFAULT_CONTEXT_POLICY,
} from '../src/index.js';
import type { WorkflowUnit } from '../src/core/types.js';

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

export async function runSequentialPipeline(task = '写一篇 Uni-Flow 简介') {
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

  return engine.run({ task });
}

const isMain =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  (process.argv[1].includes('sequential-pipeline') ||
    process.argv[1].endsWith('sequential-pipeline.ts') ||
    process.argv[1].endsWith('sequential-pipeline.js'));

if (isMain) {
  void runSequentialPipeline().then((r) => {
    console.log('completedUnits:', r.completedUnits);
    console.log('output.write:', r.state['output.write']);
  });
}
