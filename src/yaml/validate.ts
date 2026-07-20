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

/**
 * 解析仓库内 Workflow JSON Schema 的文件系统路径（`schemas/uniflow.workflow.schema.json`）。
 *
 * @returns Schema 文件的绝对路径
 */
export function resolveSchemaPath(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, '..', '..', 'schemas', SCHEMA_FILENAME);
}

/**
 * 加载并缓存 Workflow JSON Schema 对象，供 Ajv 编译或外部工具复用。
 *
 * @returns Schema 的 JSON 对象（进程内单例缓存）
 */
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

/**
 * 将 YAML 文本解析为 JS 值；语法错误时抛出 `YamlValidationError`。
 * 不做 schema 校验——若需完整校验请用 {@link validateWorkflowYamlSource}。
 *
 * @param source - YAML 字符串
 * @returns 解析后的未知结构（通常为对象）
 * @throws {YamlValidationError} YAML 语法非法时
 */
export function parseWorkflowYaml(source: string): unknown {
  try {
    return parseYaml(source);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new YamlValidationError(`Invalid YAML: ${message}`);
  }
}

/**
 * 对已解析的文档做 JSON Schema + `apiVersion` 断言校验。
 * 通过后将 `doc` 收窄为 `WorkflowYamlDocument`。
 *
 * @param doc - 任意已解析对象（通常来自 `parseWorkflowYaml`）
 * @throws {YamlValidationError} schema 失败或 `apiVersion` 不是 `uniflow/v1` 时
 */
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

/**
 * 解析 YAML 字符串并按 Workflow schema 校验，返回类型化文档。
 * CLI `uniflow validate` 与 {@link createEngineFromYaml} 均走此路径。
 *
 * @param source - Workflow YAML 文本（不是文件路径）
 * @returns 通过校验的 `WorkflowYamlDocument`
 * @throws {YamlValidationError} 语法或 schema 校验失败时
 *
 * @example
 * ```ts
 * import { validateWorkflowYamlSource } from 'uni-flow';
 *
 * const doc = validateWorkflowYamlSource(`
 * apiVersion: uniflow/v1
 * kind: Workflow
 * metadata:
 *   id: demo
 * spec:
 *   units:
 *     - id: a
 *       uses: demo.echo
 *   flow:
 *     type: sequential
 *     order: [a]
 * `);
 * console.log(doc.metadata.id); // "demo"
 * ```
 */
export function validateWorkflowYamlSource(source: string): WorkflowYamlDocument {
  const doc = parseWorkflowYaml(source);
  validateWorkflowDocument(doc);
  return doc;
}
