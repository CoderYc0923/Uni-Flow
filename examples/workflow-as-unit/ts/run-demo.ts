/**
 * Parent embeds child Workflow-as-Unit via HTTP binding.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createOrchestratorServer,
  createWorkflowRegistry,
  createUniFlowClient,
} from '../../../src/index.js';
import { startChildExecuteServer } from './child-execute-server.js';

const here = dirname(fileURLToPath(import.meta.url));
const parentYaml = readFileSync(join(here, '..', 'parent.workflow.yaml'), 'utf8');

export async function runWorkflowAsUnitDemo(opts?: { orchPort?: number; childPort?: number }) {
  const child = await startChildExecuteServer(opts?.childPort ?? 0);
  const registry = createWorkflowRegistry();
  const orch = createOrchestratorServer({ registry, port: opts?.orchPort ?? 0 });
  const { url } = await orch.start();

  const client = createUniFlowClient({ baseUrl: url });
  const registered = await client.loadAndRegister(parentYaml, {
    'child.capability': { type: 'http', endpoint: child.url },
  });
  const run = await client.startWorkflow(
    registered.workflowId,
    {
      task: 'refund timing',
      params: { $profile: 'rag.v1', mode: 'fast', topK: 5 },
    },
    { sync: true },
  );

  await orch.stop();
  await child.close();

  return { registered, run, childUrl: child.url };
}

const isMain =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  (process.argv[1].includes('run-demo') || process.argv[1].endsWith('run-demo.ts'));

if (isMain) {
  void runWorkflowAsUnitDemo({ orchPort: 8788, childPort: 9201 }).then((r) => {
    console.log('workflowId:', r.registered.workflowId);
    console.log('status:', r.run.status);
    console.log('output.child:', r.run.result?.state['output.child']);
  });
}
