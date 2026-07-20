/**
 * Workflow-as-Unit child (TS deployment B): exposes POST /execute, runs internal YAML.
 */
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createWorkflowAsUnitHttpHandler } from '../../../src/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const childYaml = readFileSync(join(here, '..', 'child-internal.workflow.yaml'), 'utf8');

const handler = createWorkflowAsUnitHttpHandler(childYaml, {
  contentStateKey: 'output.answer',
});

export function startChildExecuteServer(
  port = 0,
): Promise<{ url: string; close: () => Promise<void> }> {
  return new Promise((resolve, reject) => {
    const server = createServer(handler);
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
