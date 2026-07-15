#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { YamlValidationError, validateWorkflowYamlSource } from '../yaml/index.js';

function printHelp(): void {
  console.log(`Usage:
  uniflow validate <path-to-workflow.yaml>

Validate a Uni-Flow Workflow YAML against schemas/uniflow.workflow.schema.json
(schema only; does not resolve plugins or run the workflow).`);
}

async function validateCommand(filePath: string): Promise<number> {
  const abs = resolve(filePath);
  let text: string;
  try {
    text = await readFile(abs, 'utf8');
  } catch (err) {
    console.error(`Failed to read file: ${abs}`);
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }

  try {
    const doc = validateWorkflowYamlSource(text);
    console.log(`OK: ${abs} (workflow id: ${doc.metadata.id})`);
    return 0;
  } catch (err) {
    if (err instanceof YamlValidationError) {
      console.error(`FAIL: ${abs}`);
      console.error(err.message);
      return 1;
    }
    console.error(`FAIL: ${abs}`);
    console.error(err instanceof Error ? err.message : String(err));
    return 1;
  }
}

async function main(argv: string[]): Promise<number> {
  const [, , cmd, ...rest] = argv;
  if (!cmd || cmd === '-h' || cmd === '--help') {
    printHelp();
    return cmd ? 0 : 1;
  }
  if (cmd === 'validate') {
    const file = rest[0];
    if (!file) {
      console.error('Missing path. Usage: uniflow validate <path>');
      return 1;
    }
    return validateCommand(file);
  }
  console.error(`Unknown command: ${cmd}`);
  printHelp();
  return 1;
}

const code = await main(process.argv);
process.exit(code);
