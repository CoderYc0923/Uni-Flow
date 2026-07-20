import { describe, expect, it } from 'vitest';
import { runWorkflowAsUnitDemo } from '../examples/workflow-as-unit/ts/run-demo.js';

describe('workflow-as-unit demo', () => {
  it('parent embeds child /execute with params profile', async () => {
    const { registered, run } = await runWorkflowAsUnitDemo();
    expect(registered.workflowId).toBe('parent-embeds-child');
    expect(run.status).toBe('completed');
    expect(run.result?.state['output.child']).toBe('answered');
  });

  it('runWorkflowAsUnit maps params profile into metadata', async () => {
    const { runWorkflowAsUnit } = await import('../src/index.js');
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const yaml = readFileSync(
      join(process.cwd(), 'examples/workflow-as-unit/child-internal.workflow.yaml'),
      'utf8',
    );
    const out = await runWorkflowAsUnit(
      yaml,
      { task: 't', params: { $profile: 'rag.v1', mode: 'fast' } },
      { contentStateKey: 'output.answer' },
    );
    expect(out.content).toBe('answered');
    expect(out.metadata.profile).toBe('rag.v1');
    expect(out.metadata.mode).toBe('fast');
  });
});
