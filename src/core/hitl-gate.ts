import type { SharedState, WorkflowUnit } from './types.js';
import type { AssembledContext } from '../layer4/types.js';
import { DEFAULT_CONTEXT_POLICY } from '../layer4/types.js';

export function createHITLGateUnit(id: string): WorkflowUnit {
  return {
    id,
    runtime: {
      type: 'mock',
      async execute() {
        return {
          content: 'Awaiting human approval',
          toolCalls: [],
          stopReason: 'stop',
          metadata: { hitl: true },
        };
      },
      steer() {},
      followUp() {},
      subscribe() {
        return () => {};
      },
      cancel() {},
      frameworkInfo: () => ({ name: 'hitl-gate', version: '1.0.0' }),
    },
    terminationPolicy: {
      type: 'condition',
      predicate: (state: SharedState) => state.get('hitl.approved') === true,
    },
    inputAdapter: (_state, _context: AssembledContext) => ({
      task: 'Waiting for human approval',
    }),
    outputAdapter: (output, state) => {
      state.set('hitl.result', output.content);
    },
    contextPolicy: DEFAULT_CONTEXT_POLICY,
  };
}

export function isHITLPending(state: SharedState): boolean {
  return state.get('hitl.pending') === true && state.get('hitl.approved') !== true;
}

export function approveHITL(state: SharedState, responder: string): void {
  state.set('hitl.approved', true);
  state.set('hitl.responder', responder);
  state.set('hitl.pending', false);
}

export function rejectHITL(state: SharedState, responder: string): void {
  state.set('hitl.approved', false);
  state.set('hitl.responder', responder);
  state.set('hitl.pending', false);
  state.set('hitl.rejected', true);
}
