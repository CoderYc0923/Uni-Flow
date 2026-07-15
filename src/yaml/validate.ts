import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Ajv2020, type ErrorObject, type ValidateFunction } from 'ajv/dist/2020.js';
import { parse as parseYaml } from 'yaml';
import { formatAjvErrors, YamlValidationError } from './errors.js';
import type { WorkflowYamlDocument } from './types.js';

const SCHEMA_FILENAME = 'uniflow.workflow.schema.json';

let cachedValidate: ValidateFunction | null = null;
let cachedSchema: object | null = null;

export function resolveSchemaPath(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, '..', '..', 'schemas', SCHEMA_FILENAME);
}

export function loadWorkflowSchema(): object {
  if (cachedSchema) return cachedSchema;
  const raw = readFileSync(resolveSchemaPath(), 'utf8');
  cachedSchema = JSON.parse(raw) as object;
  return cachedSchema;
}

function getValidator(): ValidateFunction {
  if (cachedValidate) return cachedValidate;
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const validate = ajv.compile(loadWorkflowSchema());
  cachedValidate = validate;
  return validate;
}

export function parseWorkflowYaml(source: string): unknown {
  try {
    return parseYaml(source);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new YamlValidationError(`Invalid YAML: ${message}`);
  }
}

export function validateWorkflowDocument(doc: unknown): asserts doc is WorkflowYamlDocument {
  const validate = getValidator();
  const ok = validate(doc);
  if (!ok) {
    throw new YamlValidationError(
      'Workflow schema validation failed',
      formatAjvErrors(validate.errors as ErrorObject[] | null | undefined),
    );
  }
  const typed = doc as WorkflowYamlDocument;
  if (typed.apiVersion !== 'uniflow/v1') {
    throw new YamlValidationError('apiVersion must be uniflow/v1');
  }
}

export function validateWorkflowYamlSource(source: string): WorkflowYamlDocument {
  const doc = parseWorkflowYaml(source);
  validateWorkflowDocument(doc);
  return doc;
}
