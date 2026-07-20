import type { ErrorObject } from 'ajv';

/**
 * Workflow YAML 的 schema / 语义校验失败（含 Ajv 错误列表）。
 */
export class YamlValidationError extends Error {
  /** 人类可读的逐条校验错误。 */
  readonly errors: string[];

  constructor(message: string, errors: string[] = []) {
    super(errors.length ? `${message}\n${errors.map((e) => `  - ${e}`).join('\n')}` : message);
    this.name = 'YamlValidationError';
    this.errors = errors;
  }
}

/**
 * YAML 加载 / 插件解析阶段失败（如未知 `uses`、非法 binding）。
 */
export class YamlLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'YamlLoadError';
  }
}

/**
 * 将 Ajv `ErrorObject` 列表格式化为可读字符串数组。
 *
 * @param errors - Ajv 错误或 null/undefined
 * @returns 路径 + 消息 形式的字符串列表
 */
export function formatAjvErrors(errors: ErrorObject[] | null | undefined): string[] {
  if (!errors?.length) return ['unknown schema validation error'];
  return errors.map((e) => {
    const path = e.instancePath || '/';
    return `${path}: ${e.message ?? 'invalid'}${e.params ? ` (${JSON.stringify(e.params)})` : ''}`;
  });
}
