/**
 * Start an empty Orchestrator (for Python/Java demos to call from-yaml).
 */
import { createOrchestratorServer, createWorkflowRegistry } from '../../../src/index.js';
// path: examples/cross-lang/ts -> repo root src

const port = Number(process.env.UNIFLOW_PORT ?? 8787);

async function main() {
  const server = createOrchestratorServer({
    registry: createWorkflowRegistry(),
    port,
  });
  const info = await server.start();
  console.log(`Orchestrator listening at ${info.url}`);
  console.log('POST /workflows/from-yaml  then  POST /workflows/:id/runs');
}

void main();
