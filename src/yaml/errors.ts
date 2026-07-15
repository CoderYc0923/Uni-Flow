import type { ErrorObject } from 'ajv';

export class YamlValidationError extends Error {
  readonly errors: string[];

  constructor(message: string, errors: string[] = []) {
    super(errors.length ? `${message}\n${errors.map((e) => `  - ${e}`).join('\n')}` : message);
    this.name = 'YamlValidationError';
    this.errors = errors;
  }
}

export class YamlLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'YamlLoadError';
  }
}

export function formatAjvErrors(errors: ErrorObject[] | null | undefined): string[] {
  if (!errors?.length) return ['unknown schema validation error'];
  return errors.map((e) => {
    const path = e.instancePath || '/';
    return `${path}: ${e.message ?? 'invalid'}${e.params ? ` (${JSON.stringify(e.params)})` : ''}`;
  });
}
