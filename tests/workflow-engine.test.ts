import { describe, it, expect } from 'vitest';
import {
  createWorkflowEngine,
  createSharedState,
  createMessageBus,
  LoopFlow,
  SequentialFlow,
  createMockAdapter,
} from '../src/index.js';
import type { WorkflowUnit } from '../src/core/types.js';
import { DEFAULT_CONTEXT_POLICY } from '../src/layer4/types.js';

function makeUnit(id: string, taskPrefix: string): WorkflowUnit {
  return {
    id,
    runtime: createMockAdapter({
      responseFn: (input) => ({
        content: `${taskPrefix}: ${input.task}`,
        toolCalls: [],
        stopReason: 'stop',
        metadata: {},
        tokenUsage: { promptTokens: 5, completionTokens: 10, totalTokens: 15, estimatedCost: 0.001 },
      }),
    }),
    terminationPolicy: { type: 'stop-reason', reasons: ['stop'] },
    inputAdapter: (state) => ({
      task: (state.get<string>('task') ?? `task-for-${id}`) as string,
      context: state.get<string>('context'),
    }),
    outputAdapter: (output, state) => {
      state.set(`output.${id}`, output.content);
    },
    contextPolicy: DEFAULT_CONTEXT_POLICY,
  };
}

describe('LoopFlow', () => {
  it('runs single unit in a loop until condition met', async () => {
    const unit = makeUnit('agent', 'loop');
    const state = createSharedState();

    const wrappedUnit = {
      ...unit,
      outputAdapter: (output: import('../src/core/types.js').AgentOutput, s: typeof state) => {
        s.set(`output.${unit.id}`, output.content);
        s.set('loopCount', (s.get<number>('loopCount') ?? 0) + 1);
      },
    };
    const engine2 = createWorkflowEngine({
      workflowId: 'loop-test',
      units: new Map([['agent', wrappedUnit]]),
      controlFlow: new LoopFlow(
        wrappedUnit,
        5,
        (s) => (s.get<number>('loopCount') ?? 0) >= 2,
      ),
      sharedState: state,
      messageBus: createMessageBus(),
    });

    const result = await engine2.run({ task: 'hello' });
    expect(result.state['output.agent']).toBeDefined();
    expect(result.state['loopCount']).toBeGreaterThanOrEqual(2);
  });
});

describe('SequentialFlow', () => {
  it('runs units in order', async () => {
    const unitA = makeUnit('a', 'first');
    const unitB = makeUnit('b', 'second');
    const state = createSharedState();

    const engine = createWorkflowEngine({
      workflowId: 'seq-test',
      units: new Map([
        ['a', unitA],
        ['b', unitB],
      ]),
      controlFlow: new SequentialFlow([unitA, unitB]),
      sharedState: state,
      messageBus: createMessageBus(),
    });

    const result = await engine.run({ task: 'pipeline' });
    expect(result.completedUnits).toEqual(['a', 'b']);
    expect(state.get('output.a')).toContain('first');
    expect(state.get('output.b')).toContain('second');
  });
});

describe('PiAgentAdapter pattern', () => {
  it('works via injected execute function', async () => {
    const { createPiAgentAdapter } = await import('../src/adapters/pi-agent-adapter.js');
    const unit: WorkflowUnit = {
      id: 'pi-agent',
      runtime: createPiAgentAdapter({
        executeFn: async (input) => ({
          content: `pi: ${input.task}`,
          toolCalls: [],
          stopReason: 'stop',
          metadata: {},
        }),
      }),
      terminationPolicy: { type: 'stop-reason', reasons: ['stop'] },
      inputAdapter: () => ({ task: 'test' }),
      outputAdapter: (output, state) => state.set('result', output.content),
      contextPolicy: DEFAULT_CONTEXT_POLICY,
    };

    const engine = createWorkflowEngine({
      workflowId: 'pi-test',
      units: new Map([['pi-agent', unit]]),
      controlFlow: new LoopFlow(unit, 1),
      sharedState: createSharedState(),
    });

    const result = await engine.run();
    expect(result.state['result']).toBe('pi: test');
  });
});
