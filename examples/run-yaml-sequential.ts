/**
 * Runnable YAML example — load uniflow.workflow via createEngineFromYaml.
 *
 *   npx vitest run tests/yaml-loader.test.ts
 *   npm run build && node dist/cli/uniflow.js validate examples/yaml-sequential.yaml
 */
import { createEngineFromYaml } from '../src/index.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

export async function runYamlSequentialExample(task = 'hello from yaml') {
  const engine = await createEngineFromYaml(join(here, 'yaml-sequential.yaml'));
  return engine.run({ task });
}

const isMain =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  (process.argv[1].includes('yaml-sequential') || process.argv[1].endsWith('run-yaml-sequential.ts'));

if (isMain) {
  void runYamlSequentialExample().then((r) => {
    console.log('completedUnits:', r.completedUnits);
    console.log('outputs:', {
      research: r.state['output.research'],
      write: r.state['output.write'],
    });
  });
}
