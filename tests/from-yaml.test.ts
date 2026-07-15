import { createServer, type Server } from 'node:http';
import { describe, expect, it, afterEach } from 'vitest';
import {
  createOrchestratorServer,
  createWorkflowRegistry,
  createEngineFromYaml,
  YamlLoadError,
} from '../src/index.js';

const greeterYaml = `
apiVersion: uniflow/v1
kind: Workflow
metadata:
  id: cross-lang-greeter
spec:
  units:
    - id: greet
      uses: demo.greeter
  flow:
    type: sequential
    order: [greet]
`;

const mockOnlyYaml = `
apiVersion: uniflow/v1
kind: Workflow
metadata:
  id: mock-only
spec:
  units:
    - id: a
      uses: builtin.mock
      config:
        response: "ok"
  flow:
    type: sequential
`;

let servers: Server[] = [];

afterEach(async () => {
  await Promise.all(
    servers.map(
      (s) =>
        new Promise<void>((resolve) => {
          s.close(() => resolve());
        }),
    ),
  );
  servers = [];
});

function startGreeterUnit(): Promise<{ url: string; close: () => Promise<void> }> {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      if (req.method === 'POST') {
        let raw = '';
        req.on('data', (c) => {
          raw += c;
        });
        req.on('end', () => {
          let task = 'world';
          try {
            const body = JSON.parse(raw) as { input?: { task?: string } };
            task = body.input?.task ?? task;
          } catch {
            /* ignore */
          }
          const payload = JSON.stringify({
            content: `hello ${task}`,
            toolCalls: [],
            stopReason: 'stop',
            metadata: {},
          });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(payload);
        });
        return;
      }
      res.writeHead(404);
      res.end();
    });
    server.listen(0, '127.0.0.1', () => {
      servers.push(server);
      const addr = server.address();
      if (!addr || typeof addr === 'string') throw new Error('no address');
      resolve({
        url: `http://127.0.0.1:${addr.port}/execute`,
        close: () =>
          new Promise((r) => {
            server.close(() => r());
          }),
      });
    });
  });
}

describe('YAML bindings', () => {
  it('resolves HTTP binding via createEngineFromYaml', async () => {
    const unit = await startGreeterUnit();
    const engine = await createEngineFromYaml(greeterYaml, {
      bindings: {
        'demo.greeter': { type: 'http', endpoint: unit.url },
      },
    });
    const result = await engine.run({ task: 'Uni-Flow' });
    expect(result.state['output.greet']).toBe('hello Uni-Flow');
  });

  it('fails when binding missing', async () => {
    await expect(createEngineFromYaml(greeterYaml)).rejects.toBeInstanceOf(YamlLoadError);
  });
});

describe('POST /workflows/from-yaml', () => {
  it('registers and sync-runs with bindings', async () => {
    const unit = await startGreeterUnit();
    const registry = createWorkflowRegistry();
    const orch = createOrchestratorServer({ registry, port: 0 });
    const { url } = await orch.start();

    const regRes = await fetch(`${url}/workflows/from-yaml`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        yaml: greeterYaml,
        bindings: { 'demo.greeter': { type: 'http', endpoint: unit.url } },
      }),
    });
    expect(regRes.status).toBe(201);
    const regBody = (await regRes.json()) as { workflowId: string };
    expect(regBody.workflowId).toBe('cross-lang-greeter');

    const runRes = await fetch(`${url}/workflows/cross-lang-greeter/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: { task: 'api' }, sync: true }),
    });
    expect(runRes.status).toBe(202);
    const runBody = (await runRes.json()) as {
      status: string;
      result?: { state: Record<string, unknown> };
    };
    expect(runBody.status).toBe('completed');
    expect(runBody.result?.state['output.greet']).toBe('hello api');

    await orch.stop();
  });

  it('rejects invalid yaml with 400', async () => {
    const registry = createWorkflowRegistry();
    const orch = createOrchestratorServer({ registry, port: 0 });
    const { url } = await orch.start();
    const regRes = await fetch(`${url}/workflows/from-yaml`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        yaml: 'apiVersion: wrong\nkind: X\n',
      }),
    });
    expect(regRes.status).toBe(400);
    await orch.stop();
  });

  it('rejects missing binding with 400', async () => {
    const registry = createWorkflowRegistry();
    const orch = createOrchestratorServer({ registry, port: 0 });
    const { url } = await orch.start();
    const regRes = await fetch(`${url}/workflows/from-yaml`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ yaml: greeterYaml }),
    });
    expect(regRes.status).toBe(400);
    const body = (await regRes.json()) as { error: string };
    expect(body.error).toMatch(/demo\.greeter/);
    await orch.stop();
  });

  it('registers builtin.mock without bindings', async () => {
    const registry = createWorkflowRegistry();
    const orch = createOrchestratorServer({ registry, port: 0 });
    const { url } = await orch.start();
    const regRes = await fetch(`${url}/workflows/from-yaml`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ yaml: mockOnlyYaml }),
    });
    expect(regRes.status).toBe(201);
    await orch.stop();
  });
});
