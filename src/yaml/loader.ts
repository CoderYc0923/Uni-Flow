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
 * Load a Workflow YAML from file path or raw YAML string and construct an Engine.
 */
export async function createEngineFromYaml(
  source: string,
  options: CreateEngineFromYamlOptions = {},
): Promise<WorkflowEngine> {
  const text = await resolveYamlText(source);
  const doc = validateWorkflowYamlSource(text);
  return createEngineFromDocument(doc, options);
}

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
