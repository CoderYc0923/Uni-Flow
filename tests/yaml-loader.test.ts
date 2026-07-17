import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  createEngineFromYaml,
  createMockAdapter,
  YamlLoadError,
  YamlValidationError,
  validateWorkflowYamlSource,
} from '../src/index.js';
import type { AgentInput } from '../src/index.js';

const templatesDir = join(process.cwd(), 'examples', 'templates');

const minimalSequential = `
apiVersion: uniflow/v1
kind: Workflow
metadata:
  id: seq-demo
spec:
  units:
    - id: a
      uses: builtin.mock
      config:
        response: "first"
    - id: b
      uses: builtin.mock
      config:
        response: "second"
  flow:
    type: sequential
    order: [a, b]
`;

const invalidVersion = `
apiVersion: uniflow/v0
kind: Workflow
metadata:
  id: bad
spec:
  units:
    - id: a
      uses: builtin.mock
  flow:
    type: sequential
`;

describe('workflow YAML schema', () => {
  it('accepts a minimal valid sequential document', () => {
    const doc = validateWorkflowYamlSource(minimalSequential);
    expect(doc.metadata.id).toBe('seq-demo');
    expect(doc.spec.flow.type).toBe('sequential');
  });

  it('rejects unknown apiVersion', () => {
    expect(() => validateWorkflowYamlSource(invalidVersion)).toThrow(YamlValidationError);
  });

  it('rejects missing units', () => {
    const yaml = `
apiVersion: uniflow/v1
kind: Workflow
metadata:
  id: empty
spec:
  flow:
    type: sequential
`;
    expect(() => validateWorkflowYamlSource(yaml)).toThrow(YamlValidationError);
  });

  it('accepts router flow shape', () => {
    const yaml = `
apiVersion: uniflow/v1
kind: Workflow
metadata:
  id: router-demo
spec:
  units:
    - id: router
      uses: builtin.mock
    - id: a
      uses: builtin.mock
    - id: b
      uses: builtin.mock
  flow:
    type: router
    routerUnit: router
    routes:
      a: a
      b: b
`;
    expect(validateWorkflowYamlSource(yaml).spec.flow.type).toBe('router');
  });
});

describe('createEngineFromYaml', () => {
  it('runs sequential workflow with builtin.mock', async () => {
    const engine = await createEngineFromYaml(minimalSequential);
    const result = await engine.run({ task: 'hello' });
    expect(result.completedUnits).toEqual(['a', 'b']);
    expect(result.state['output.a']).toBe('first');
    expect(result.state['output.b']).toBe('second');
  });

  it('fails fast on missing registry plugin', async () => {
    const yaml = `
apiVersion: uniflow/v1
kind: Workflow
metadata:
  id: missing-plugin
spec:
  units:
    - id: record
      uses: accounting.record
  flow:
    type: sequential
`;
    await expect(createEngineFromYaml(yaml)).rejects.toBeInstanceOf(YamlLoadError);
    await expect(createEngineFromYaml(yaml)).rejects.toThrow(/accounting\.record/);
  });

  it('applies policy timeout from YAML', async () => {
    const yaml = `
apiVersion: uniflow/v1
kind: Workflow
metadata:
  id: policy-demo
spec:
  policy:
    timeout:
      unitMs: 50
      workflowMs: 1000
  units:
    - id: a
      uses: builtin.mock
  flow:
    type: sequential
`;
    const engine = await createEngineFromYaml(yaml);
    const result = await engine.run({ task: 'x' });
    expect(result.completedUnits).toContain('a');
  });

  it('passes run params through default inputAdapter', async () => {
    let seen: AgentInput | undefined;
    const yaml = `
apiVersion: uniflow/v1
kind: Workflow
metadata:
  id: params-demo
spec:
  units:
    - id: a
      uses: capture.agent
  flow:
    type: sequential
    order: [a]
`;
    const engine = await createEngineFromYaml(yaml, {
      registry: {
        'capture.agent': () =>
          createMockAdapter({
            responseFn: (input) => {
              seen = input;
              return {
                content: 'ok',
                toolCalls: [],
                stopReason: 'stop',
                metadata: {},
              };
            },
          }),
      },
    });
    await engine.run({
      task: 'q',
      params: { $profile: 'rag.v1', topK: 5 },
    });
    expect(seen?.task).toBe('q');
    expect(seen?.params).toEqual({ $profile: 'rag.v1', topK: 5 });
  });

  it('runs without params when omitted', async () => {
    const engine = await createEngineFromYaml(minimalSequential);
    const result = await engine.run({ task: 'hello' });
    expect(result.completedUnits).toEqual(['a', 'b']);
  });
});

describe('example templates', () => {
  const names = ['qa', 'rag', 'vertical-transaction', 'media-pipeline'];
  for (const name of names) {
    it(`validates template ${name}`, () => {
      const text = readFileSync(join(templatesDir, `${name}.yaml`), 'utf8');
      expect(() => validateWorkflowYamlSource(text)).not.toThrow();
    });
  }
});
