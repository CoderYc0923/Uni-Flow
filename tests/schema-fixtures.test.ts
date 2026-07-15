import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateWorkflowYamlSource, YamlValidationError } from '../src/index.js';

const dir = join(process.cwd(), 'tests/fixtures/workflow-yaml');

describe('shared workflow YAML fixtures', () => {
  it('accepts valid-sequential.yaml', () => {
    const text = readFileSync(join(dir, 'valid-sequential.yaml'), 'utf8');
    expect(validateWorkflowYamlSource(text).metadata.id).toBe('fixture-valid-sequential');
  });

  it('rejects invalid-api-version.yaml', () => {
    const text = readFileSync(join(dir, 'invalid-api-version.yaml'), 'utf8');
    expect(() => validateWorkflowYamlSource(text)).toThrow(YamlValidationError);
  });

  it('rejects invalid-router-missing-routes.yaml', () => {
    const text = readFileSync(join(dir, 'invalid-router-missing-routes.yaml'), 'utf8');
    expect(() => validateWorkflowYamlSource(text)).toThrow(YamlValidationError);
  });

  it('fixture directory is non-empty', () => {
    expect(readdirSync(dir).length).toBeGreaterThan(0);
  });
});
