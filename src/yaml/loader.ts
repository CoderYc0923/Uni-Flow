import { createSharedState } from '../core/shared-state.js';
import type { RuntimeAdapter, WorkflowConfig, WorkflowEngine, WorkflowUnit } from '../core/types.js';
import { createWorkflowEngine, type WorkflowEngineOptions } from '../core/workflow-engine.js';
import {
  DEFAULT_CONTEXT_POLICY,
  DEFAULT_POLICY_CONFIG,
  type ContextPolicy,
  type PolicyConfig,
} from '../layer4/types.js';
import { mergePluginRegistries, registryFromBindings } from './bindings.js';
import { resolvePlugin } from './builtins.js';
import { YamlLoadError } from './errors.js';
import { buildControlFlow } from './flow-mapper.js';
import type {
  CreateEngineFromYamlOptions,
  PartialDeepContextPolicy,
  UnitPluginResult,
  WorkflowYamlDocument,
  YamlPolicy,
  YamlUnit,
} from './types.js';
import { validateWorkflowDocument, validateWorkflowYamlSource } from './validate.js';
import { access, readFile } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';

function mergePolicy(partial?: YamlPolicy): Partial<PolicyConfig> | undefined {
  if (!partial) return undefined;
  const base = DEFAULT_POLICY_CONFIG;
  return {
    retry: { ...base.retry, ...partial.retry },
    timeout: { ...base.timeout, ...partial.timeout },
    budget: { ...base.budget, ...partial.budget },
    concurrency: { ...base.concurrency, ...partial.concurrency },
    circuitBreaker: { ...base.circuitBreaker, ...partial.circuitBreaker },
    rateLimit: { ...base.rateLimit, ...partial.rateLimit },
  };
}

function mergeContextPolicy(partial?: PartialDeepContextPolicy): ContextPolicy {
  const d = DEFAULT_CONTEXT_POLICY;
  if (!partial) {
    return {
      ...d,
      sessionMemory: { ...d.sessionMemory },
      longTermMemory: { ...d.longTermMemory },
      vectorMemory: { ...d.vectorMemory },
      workingMemory: { ...d.workingMemory },
    };
  }
  return {
    workingMemory: { ...d.workingMemory, ...partial.workingMemory },
    sessionMemory: { ...d.sessionMemory, ...partial.sessionMemory },
    longTermMemory: { ...d.longTermMemory, ...partial.longTermMemory },
    vectorMemory: { ...d.vectorMemory, ...partial.vectorMemory },
    compaction: partial.compaction ?? d.compaction,
  };
}

function isWorkflowUnit(value: UnitPluginResult): value is WorkflowUnit {
  return (
    typeof value === 'object' &&
    value !== null &&
    'runtime' in value &&
    'inputAdapter' in value &&
    'outputAdapter' in value
  );
}

async function materializePlugin(
  plugin: import('./types.js').UnitPlugin,
  config?: Record<string, unknown>,
): Promise<UnitPluginResult> {
  if (typeof plugin === 'function') {
    return plugin(config);
  }
  return plugin;
}

function wrapAdapter(id: string, runtime: RuntimeAdapter, yamlUnit: YamlUnit): WorkflowUnit {
  return {
    id,
    runtime,
    terminationPolicy: { type: 'stop-reason', reasons: ['stop'] },
    inputAdapter: (state) => {
      const nested = state.get<Record<string, unknown>>('input.params');
      const top = state.get<Record<string, unknown>>('params');
      const params =
        nested && typeof nested === 'object' && !Array.isArray(nested)
          ? nested
          : top && typeof top === 'object' && !Array.isArray(top)
            ? top
            : undefined;
      return {
        task: (state.get<string>('task') as string) ?? '',
        context: state.get<string>('context'),
        ...(params ? { params } : {}),
      };
    },
    outputAdapter: (output, state) => {
      state.set(`output.${id}`, output.content);
      const route = output.metadata?.route;
      if (typeof route === 'string') {
        state.set('route', route);
      }
    },
    contextPolicy: mergeContextPolicy(yamlUnit.contextPolicy),
    policyOverrides: mergePolicy(yamlUnit.policyOverrides),
  };
}

function resolveMergedRegistry(options: CreateEngineFromYamlOptions) {
  // Explicit registry wins on conflicts.
  return mergePluginRegistries(registryFromBindings(options.bindings), options.registry);
}

async function buildUnit(
  yamlUnit: YamlUnit,
  registry: ReturnType<typeof resolveMergedRegistry>,
): Promise<WorkflowUnit> {
  let plugin;
  try {
    plugin = resolvePlugin(yamlUnit.uses, registry);
  } catch (err) {
    throw new YamlLoadError(err instanceof Error ? err.message : String(err));
  }
  const result = await materializePlugin(plugin, yamlUnit.config);
  if (isWorkflowUnit(result)) {
    return {
      ...result,
      id: yamlUnit.id,
      contextPolicy: yamlUnit.contextPolicy
        ? mergeContextPolicy(yamlUnit.contextPolicy)
        : (result.contextPolicy ?? mergeContextPolicy()),
      policyOverrides: yamlUnit.policyOverrides
        ? mergePolicy(yamlUnit.policyOverrides)
        : result.policyOverrides,
    };
  }
  return wrapAdapter(yamlUnit.id, result, yamlUnit);
}

/**
 * 将已校验的 Workflow YAML 文档物化为 `WorkflowConfig`（含 ControlFlow 与 Units）。
 * 不启动运行；适合先拿配置再交给 {@link createWorkflowEngine} 或自定义包装。
 *
 * @param doc - 通过 schema 校验的 `WorkflowYamlDocument`
 * @param options - `registry` / `bindings` / `engineOptions`
 * @returns `config` 与合并后的引擎 `options`
 */
export async function createWorkflowConfigFromDocument(
  doc: WorkflowYamlDocument,
  options: CreateEngineFromYamlOptions = {},
): Promise<{ config: WorkflowConfig; options?: WorkflowEngineOptions }> {
  validateWorkflowDocument(doc);
  const registry = resolveMergedRegistry(options);

  const unitEntries = await Promise.all(
    doc.spec.units.map(async (u) => [u.id, await buildUnit(u, registry)] as const),
  );
  const units = new Map<string, WorkflowUnit>(unitEntries);

  const controlFlow = buildControlFlow(doc.spec.flow, units);
  const policyConfig = mergePolicy(doc.spec.policy);

  return {
    config: {
      workflowId: doc.metadata.id,
      units,
      controlFlow,
      sharedState: createSharedState(),
    },
    options: {
      ...options.engineOptions,
      policyConfig: {
        ...policyConfig,
        ...options.engineOptions?.policyConfig,
      },
    },
  };
}

/**
 * 从已校验文档直接构造可运行的 `WorkflowEngine`。
 *
 * @param doc - `WorkflowYamlDocument`
 * @param options - 插件注册表与引擎选项
 * @returns 可调用 `run()` 的引擎实例
 */
export async function createEngineFromDocument(
  doc: WorkflowYamlDocument,
  options: CreateEngineFromYamlOptions = {},
): Promise<WorkflowEngine> {
  const built = await createWorkflowConfigFromDocument(doc, options);
  return createWorkflowEngine(built.config, built.options);
}

async function resolveYamlText(source: string): Promise<string> {
  try {
    await access(source, fsConstants.R_OK);
    return await readFile(source, 'utf8');
  } catch {
    return source;
  }
}

/**
 * YAML 路径主入口：从文件路径或 YAML 字符串加载、校验并构造 `WorkflowEngine`。
 *
 * - `source` 若为可读文件路径则读文件；否则当作 YAML 文本
 * - 校验走 {@link validateWorkflowYamlSource}；`uses` 经 builtin + `registry` / `bindings` 解析
 * - 生产编排优先本函数；代码拼拓扑请用 {@link createWorkflowEngine}
 *
 * @param source - Workflow YAML 文件路径，或完整 YAML 字符串
 * @param options - 插件表、HTTP bindings、额外引擎选项
 * @returns 可调用 `run()` / `resume()` 的引擎
 *
 * @example
 * ```ts
 * import { createEngineFromYaml, createMockAdapter } from 'uni-flow';
 *
 * const engine = await createEngineFromYaml(
 *   `apiVersion: uniflow/v1
 * kind: Workflow
 * metadata:
 *   id: demo
 * spec:
 *   units:
 *     - id: echo
 *       uses: demo.echo
 *   flow:
 *     type: sequential
 *     order: [echo]
 * `,
 *   {
 *     registry: {
 *       'demo.echo': () => createMockAdapter({
 *         responseFn: (input) => ({
 *           content: `echo:${input.task}`,
 *           toolCalls: [],
 *           stopReason: 'stop',
 *           metadata: {},
 *         }),
 *       }),
 *     },
 *   },
 * );
 * const result = await engine.run({ task: 'hello' });
 * console.log(result.state['output.echo']);
 * ```
 */
export async function createEngineFromYaml(
  source: string,
  options: CreateEngineFromYamlOptions = {},
): Promise<WorkflowEngine> {
  const text = await resolveYamlText(source);
  const doc = validateWorkflowYamlSource(text);
  return createEngineFromDocument(doc, options);
}

/**
 * 从路径或 YAML 字符串构建配置（含 `workflowId`），不立即创建引擎。
 * Orchestrator `registerFromYaml` 等场景会复用本函数以便每次 run 拿到新 ControlFlow 游标。
 *
 * @param source - 文件路径或 YAML 文本
 * @param options - 同 {@link createEngineFromYaml}
 * @returns `workflowId`、`config` 与可选引擎 `options`
 */
export async function createWorkflowConfigFromYaml(
  source: string,
  options: CreateEngineFromYamlOptions = {},
): Promise<{ workflowId: string; config: WorkflowConfig; options?: WorkflowEngineOptions }> {
  const text = await resolveYamlText(source);
  const doc = validateWorkflowYamlSource(text);
  const built = await createWorkflowConfigFromDocument(doc, options);
  return { workflowId: doc.metadata.id, ...built };
}

export {
  validateWorkflowYamlSource,
  validateWorkflowDocument,
  resolveSchemaPath,
  loadWorkflowSchema,
} from './validate.js';
export { YamlValidationError, YamlLoadError } from './errors.js';
export { registryFromBindings, mergePluginRegistries } from './bindings.js';
export type { UsesBindings, HttpUsesBinding } from './bindings.js';
export type {
  CreateEngineFromYamlOptions,
  UnitPlugin,
  UnitPluginRegistry,
  WorkflowYamlDocument,
} from './types.js';
