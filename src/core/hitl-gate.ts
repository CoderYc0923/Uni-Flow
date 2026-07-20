import type { SharedState, WorkflowUnit } from './types.js';
import type { AssembledContext } from '../layer4/types.js';
import { DEFAULT_CONTEXT_POLICY } from '../layer4/types.js';

/**
 * 创建一个用于人工审核（HITL）门闸的 {@link WorkflowUnit}：执行后等待 `hitl.approved === true`。
 *
 * @param id - Unit id
 * @returns 可挂入 ControlFlow 的 HITL Unit
 */
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

/** 判断 SharedState 上是否仍有未批准的 HITL 请求。 */
export function isHITLPending(state: SharedState): boolean {
  return state.get('hitl.pending') === true && state.get('hitl.approved') !== true;
}

/**
 * 批准 HITL：写入 `hitl.approved` / `hitl.responder`，并清除 pending。
 *
 * @param state - 共享状态
 * @param responder - 审批人标识
 */
export function approveHITL(state: SharedState, responder: string): void {
  state.set('hitl.approved', true);
  state.set('hitl.responder', responder);
  state.set('hitl.pending', false);
}

/**
 * 拒绝 HITL：写入拒绝标志并清除 pending。
 *
 * @param state - 共享状态
 * @param responder - 操作人标识
 */
export function rejectHITL(state: SharedState, responder: string): void {
  state.set('hitl.approved', false);
  state.set('hitl.responder', responder);
  state.set('hitl.pending', false);
  state.set('hitl.rejected', true);
}
