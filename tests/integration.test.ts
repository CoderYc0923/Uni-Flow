import { describe, it, expect } from 'vitest';
import {
  createWorkflowEngine,
  createSharedState,
  LoopFlow,
  SequentialFlow,
  RouterFlow,
  createMockAdapter,
  createCheckpointStore,
  createContextManager,
  createPolicyEngine,
} from '../src/index.js';
import type { WorkflowUnit, AgentOutput } from '../src/core/types.js';
import { DEFAULT_CONTEXT_POLICY } from '../src/layer4/types.js';

describe('Checkpoint resume', () => {
  it('resumes from saved checkpoint', async () => {
    const unitA = makeUnit('a', 'step-a');
    const unitB = makeUnit('b', 'step-b');
    const checkpointStore = createCheckpointStore();
    const state = createSharedState();

    const config = {
      workflowId: 'resume-test',
      units: new Map([
        ['a', unitA],
        ['b', unitB],
      ]),
      controlFlow: new SequentialFlow([unitA, unitB]),
      sharedState: state,
    };

    const engine1 = createWorkflowEngine(config, { checkpointStore });
    const partial = await engine1.run({ task: 'resume-me' });
    const runId = partial.runId;

    expect(partial.completedUnits).toContain('a');
    expect(partial.completedUnits).toContain('b');

    const engine2 = createWorkflowEngine(config, { checkpointStore });
    const resumed = await engine2.resume(runId);
    expect(resumed.runId).toBe(runId);
  });
});

describe('PolicyEngine retry', () => {
  it('retries on transient failure', async () => {
    let attempts = 0;
    const unit: WorkflowUnit = {
      id: 'flaky',
      runtime: createMockAdapter({
        responseFn: () => {
          attempts++;
          if (attempts < 2) throw new Error('transient');
          return {
            content: 'success',
            toolCalls: [],
            stopReason: 'stop',
            metadata: {},
          };
        },
      }),
      terminationPolicy: { type: 'stop-reason', reasons: ['stop'] },
      inputAdapter: () => ({ task: 'retry' }),
      outputAdapter: (o, s) => s.set('result', o.content),
      contextPolicy: DEFAULT_CONTEXT_POLICY,
      policyOverrides: { retry: { maxAttempts: 3, backoff: 'fixed', baseMs: 10 } },
    };

    const engine = createWorkflowEngine({
      workflowId: 'retry-test',
      units: new Map([['flaky', unit]]),
      controlFlow: new LoopFlow(unit, 1),
      sharedState: createSharedState(),
    }, { policyEngine: createPolicyEngine() });

    const result = await engine.run();
    expect(attempts).toBe(2);
    expect(result.state['result']).toBe('success');
  });
});

describe('ContextManager cross-unit', () => {
  it('passes session context between units', async () => {
    const contextManager = createContextManager();
    const unitA = makeUnit('planner', 'planned');
    const unitB: WorkflowUnit = {
      id: 'executor',
      runtime: createMockAdapter({
        responseFn: (input) => ({
          content: `executed with context: ${input.context ?? 'none'}`,
          toolCalls: [],
          stopReason: 'stop',
          metadata: {},
        }),
      }),
      terminationPolicy: { type: 'stop-reason', reasons: ['stop'] },
      inputAdapter: (_state, ctx) => ({
        task: 'execute',
        context: ctx.messages.map((m) => m.content).join('\n'),
      }),
      outputAdapter: (o, s) => s.set('exec', o.content),
      contextPolicy: {
        ...DEFAULT_CONTEXT_POLICY,
        sessionMemory: { include: ['planner'], maxTokens: 8000 },
      },
    };

    const engine = createWorkflowEngine({
      workflowId: 'ctx-test',
      units: new Map([
        ['planner', unitA],
        ['executor', unitB],
      ]),
      controlFlow: new SequentialFlow([unitA, unitB]),
      sharedState: createSharedState(),
    }, { contextManager });

    const result = await engine.run({ task: 'plan something' });
    expect(result.state['exec']).toContain('planned');
  });
});

describe('Router + Sequential hybrid', () => {
  it('routes to correct handler', async () => {
    const router: WorkflowUnit = {
      id: 'router',
      runtime: createMockAdapter({
        responseFn: () => ({
          content: 'quick',
          toolCalls: [],
          stopReason: 'stop',
          metadata: {},
        }),
      }),
      terminationPolicy: { type: 'stop-reason', reasons: ['stop'] },
      inputAdapter: () => ({ task: 'route' }),
      outputAdapter: () => {},
      contextPolicy: DEFAULT_CONTEXT_POLICY,
    };

    const quickHandler = makeUnit('quick-handler', 'quick-review', (output, state) => {
      state.set('output.quick-handler', output.content);
      state.set('handler.quick.done', true);
    });
    const deepHandler = makeUnit('deep-handler', 'deep-review');

    const flow = new RouterFlow(
      router,
      new Map([
        ['quick', quickHandler],
        ['deep', deepHandler],
      ]),
      (output: AgentOutput) => output.content.trim(),
    );

    const state = createSharedState();
    const engine = createWorkflowEngine({
      workflowId: 'router-test',
      units: new Map([
        ['router', router],
        ['quick-handler', quickHandler],
        ['deep-handler', deepHandler],
      ]),
      controlFlow: flow,
      sharedState: state,
    });

    const result = await engine.run();
    expect(result.completedUnits).toContain('router');
    expect(result.completedUnits).toContain('quick-handler');
    expect(state.get('output.quick-handler')).toContain('quick-review');
  });
});

function makeUnit(
  id: string,
  prefix: string,
  outputAdapter?: WorkflowUnit['outputAdapter'],
): WorkflowUnit {
  return {
    id,
    runtime: createMockAdapter({
      responseFn: (input) => ({
        content: `${prefix}: ${input.task}`,
        toolCalls: [],
        stopReason: 'stop',
        metadata: {},
        tokenUsage: { promptTokens: 5, completionTokens: 10, totalTokens: 15 },
      }),
    }),
    terminationPolicy: { type: 'stop-reason', reasons: ['stop'] },
    inputAdapter: (state) => ({ task: (state.get<string>('task') ?? id) as string }),
    outputAdapter:
      outputAdapter ??
      ((output, state) => {
        state.set(`output.${id}`, output.content);
      }),
    contextPolicy: DEFAULT_CONTEXT_POLICY,
  };
}
