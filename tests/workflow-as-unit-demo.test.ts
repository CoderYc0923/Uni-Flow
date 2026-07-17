import { describe, expect, it } from 'vitest';
import { runWorkflowAsUnitDemo } from '../examples/workflow-as-unit/ts/run-demo.js';

describe('workflow-as-unit demo', () => {
  it('parent embeds child /execute with params profile', async () => {
    const { registered, run } = await runWorkflowAsUnitDemo();
    expect(registered.workflowId).toBe('parent-embeds-child');
    expect(run.status).toBe('completed');
    expect(run.result?.state['output.child']).toBe('answered');
  });
});
