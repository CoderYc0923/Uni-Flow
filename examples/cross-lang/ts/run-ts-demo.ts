/**
 * Cross-lang TS demo: Orchestrator + HTTP greeter + from-yaml + sync run.
 */
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createOrchestratorServer,
  createWorkflowRegistry,
  createUniFlowClient,
} from '../../../src/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const yamlPath = join(here, '..', 'greeter.workflow.yaml');

function startGreeter(port = 0): Promise<{ url: string; close: () => Promise<void> }> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      if (req.method !== 'POST') {
        res.writeHead(404);
        res.end();
        return;
      }
      let raw = '';
      req.on('data', (c) => {
        raw += c;
      });
      req.on('end', () => {
        let task = 'world';
        try {
          task = (JSON.parse(raw) as { input?: { task?: string } }).input?.task ?? task;
        } catch {
          /* ignore */
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            content: `hello ${task}`,
            toolCalls: [],
            stopReason: 'stop',
            metadata: {},
          }),
        );
      });
    });
    server.listen(port, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        reject(new Error('no address'));
        return;
      }
      resolve({
        url: `http://127.0.0.1:${addr.port}/execute`,
        close: () => new Promise((r) => server.close(() => r())),
      });
    });
  });
}

export async function runCrossLangTsDemo(opts?: { orchPort?: number; unitPort?: number }) {
  const unit = await startGreeter(opts?.unitPort ?? 0);
  const registry = createWorkflowRegistry();
  const orch = createOrchestratorServer({ registry, port: opts?.orchPort ?? 0 });
  const { url } = await orch.start();

  const client = createUniFlowClient({ baseUrl: url });
  const yaml = readFileSync(yamlPath, 'utf8');
  const validated = await client.validateYaml(yaml);
  const registered = await client.loadAndRegister(yaml, {
    'demo.greeter': { type: 'http', endpoint: unit.url },
  });
  const run = await client.startWorkflow(registered.workflowId, { task: 'cross-lang' }, { sync: true });

  await orch.stop();
  await unit.close();

  return { validated, registered, run };
}

const isMain =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  (process.argv[1].includes('run-ts-demo') || process.argv[1].endsWith('run-ts-demo.ts'));

if (isMain) {
  void runCrossLangTsDemo({ orchPort: 8787, unitPort: 9101 }).then((r) => {
    console.log('workflowId:', r.registered.workflowId);
    console.log('status:', r.run.status);
    console.log('output.greet:', r.run.result?.state['output.greet']);
  });
}
