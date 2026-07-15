/**
 * 案例 B：Router 分流示例（可嵌入更大混合拓扑）。
 *
 * 对应 README「完整案例 B」。
 * 使用 MockRuntimeAdapter — 生产环境可替换为 PiAgentAdapter / HttpAdapter / McpAdapter。
 */
import {
  createWorkflowEngine,
  createSharedState,
  RouterFlow,
  DAGFlow,
  LoopFlow,
  SequentialFlow,
  CompositeFlow,
  createMockAdapter,
} from '../src/index.js';
import type { WorkflowUnit, AgentOutput } from '../src/core/types.js';
import { DEFAULT_CONTEXT_POLICY } from '../src/layer4/types.js';

function unit(id: string, fn: (task: string) => string): WorkflowUnit {
  return {
    id,
    runtime: createMockAdapter({
      responseFn: (input) => ({
        content: fn(input.task),
        toolCalls: [],
        stopReason: 'stop',
        metadata: {},
      }),
    }),
    terminationPolicy: { type: 'stop-reason', reasons: ['stop'] },
    inputAdapter: (state) => ({ task: (state.get<string>('task') ?? '') as string }),
    outputAdapter: (output, state) => state.set(`output.${id}`, output.content),
    contextPolicy: DEFAULT_CONTEXT_POLICY,
  };
}

export function buildCodeReviewWorkflow() {
  const router = unit('router', () => 'deep');

  const planner = unit('planner', () => JSON.stringify({ steps: ['security', 'performance', 'aggregate'] }));
  const securityActor = unit('security-actor', (t) => `security scan: ${t}`);
  const securityEvaluator = unit('security-evaluator', () => 'score:9');
  const securityReflexion = new LoopFlow(
    new SequentialFlow([securityActor, securityEvaluator]),
    3,
    (s) => (s.get<string>('output.security-evaluator') ?? '').includes('9'),
  );

  const performance = unit('performance', (t) => `perf: ${t}`);
  const aggregator = unit('aggregator', () => 'final review report');

  const dag = new DAGFlow(
    planner,
    new Map([
      ['security', securityActor],
      ['performance', performance],
    ]),
    aggregator,
    new Map([['performance', ['security']]]),
  );

  const deepPipeline = new CompositeFlow([securityReflexion, dag]);

  const quickReview = unit('quick-review', (t) => `quick: ${t}`);

  const flow = new RouterFlow(
    router,
    new Map([
      ['quick', quickReview],
      ['deep', securityActor],
    ]),
    (o: AgentOutput) => o.content.trim(),
  );

  return createWorkflowEngine({
    workflowId: 'code-review',
    units: new Map([
      ['router', router],
      ['planner', planner],
      ['security-actor', securityActor],
      ['security-evaluator', securityEvaluator],
      ['performance', performance],
      ['aggregator', aggregator],
      ['quick-review', quickReview],
    ]),
    controlFlow: flow,
    sharedState: createSharedState(),
  });
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  const engine = buildCodeReviewWorkflow();
  engine.run({ task: 'review src/index.ts' }).then((r) => {
    console.log('Completed units:', r.completedUnits);
    console.log('State keys:', Object.keys(r.state));
  });
}
