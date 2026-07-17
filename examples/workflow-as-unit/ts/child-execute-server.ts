/**
 * Workflow-as-Unit child: runs an internal Uni-Flow workflow, exposes POST /execute.
 */
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createEngineFromYaml } from '../../../src/index.js';
import type { AgentInput, AgentOutput } from '../../../src/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const childYaml = readFileSync(join(here, '..', 'child-internal.workflow.yaml'), 'utf8');

export async function handleExecute(input: AgentInput): Promise<AgentOutput> {
  const engine = await createEngineFromYaml(childYaml);
  const result = await engine.run({
    task: input.task,
    ...(input.params ? { params: input.params } : {}),
    ...(input.context ? { context: input.context } : {}),
  });
  const mode = input.params?.mode;
  return {
    content: String(result.state['output.answer'] ?? 'done'),
    toolCalls: [],
    stopReason: 'stop',
    metadata: {
      completedUnits: result.completedUnits,
      ...(typeof input.params?.$profile === 'string'
        ? { profile: input.params.$profile }
        : {}),
      ...(typeof mode === 'string' ? { mode } : {}),
    },
    tokenUsage: {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: result.tokenUsage,
      estimatedCost: result.cost,
    },
  };
}

export function startChildExecuteServer(
  port = 0,
): Promise<{ url: string; close: () => Promise<void> }> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      if (req.method !== 'POST' || !req.url?.endsWith('/execute')) {
        res.writeHead(404);
        res.end();
        return;
      }
      let raw = '';
      req.on('data', (c) => {
        raw += c;
      });
      req.on('end', () => {
        void (async () => {
          try {
            const body = JSON.parse(raw) as { input?: AgentInput };
            const output = await handleExecute(body.input ?? { task: '' });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(output));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                content: '',
                toolCalls: [],
                stopReason: 'error',
                metadata: { error: err instanceof Error ? err.message : String(err) },
              }),
            );
          }
        })();
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

const isMain =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  (process.argv[1].includes('child-execute-server') ||
    process.argv[1].endsWith('child-execute-server.ts'));

if (isMain) {
  void startChildExecuteServer(9201).then(({ url }) => {
    console.log('child /execute at', url);
  });
}
