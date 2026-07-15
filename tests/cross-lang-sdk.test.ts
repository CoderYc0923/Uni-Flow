import { describe, expect, it } from 'vitest';
import { runCrossLangTsDemo } from '../examples/cross-lang/ts/run-ts-demo.js';
import { createUniFlowClient } from '../src/index.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('cross-lang TS demo', () => {
  it('validate + from-yaml + sync run', async () => {
    const r = await runCrossLangTsDemo({ orchPort: 0, unitPort: 0 });
    expect(r.registered.workflowId).toBe('cross-lang-greeter');
    expect(r.run.status).toBe('completed');
    expect(r.run.result?.state['output.greet']).toContain('hello');
  });
});

describe('UniFlowClient validateYaml / loadAndRegister errors', () => {
  it('validateYaml accepts shared greeter yaml', async () => {
    const client = createUniFlowClient();
    const text = readFileSync(
      join(process.cwd(), 'examples/cross-lang/greeter.workflow.yaml'),
      'utf8',
    );
    const v = await client.validateYaml(text);
    expect(v.ok).toBe(true);
    expect(v.workflowId).toBe('cross-lang-greeter');
  });

  it('loadAndRegister without baseUrl throws', async () => {
    const client = createUniFlowClient();
    await expect(client.loadAndRegister('apiVersion: x')).rejects.toThrow(/baseUrl/);
  });

  it('remote health to dead port throws', async () => {
    const client = createUniFlowClient({ baseUrl: 'http://127.0.0.1:1' });
    await expect(client.health()).rejects.toThrow();
  });
});
