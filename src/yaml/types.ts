import type { ContextPolicy, PolicyConfig } from '../layer4/types.js';
import type { FailureStrategy, RuntimeAdapter, WorkflowUnit } from '../core/types.js';

export interface WorkflowYamlDocument {
  apiVersion: 'uniflow/v1';
  kind: 'Workflow';
  metadata: {
    id: string;
    description?: string;
  };
  spec: {
    entry?: string;
    policy?: YamlPolicy;
    units: YamlUnit[];
    flow: YamlFlow;
  };
}

export interface YamlUnit {
  id: string;
  uses: string;
  config?: Record<string, unknown>;
  contextPolicy?: PartialDeepContextPolicy;
  policyOverrides?: YamlPolicy;
}

export type YamlPolicy = {
  retry?: Partial<PolicyConfig['retry']>;
  timeout?: Partial<PolicyConfig['timeout']>;
  budget?: Partial<PolicyConfig['budget']>;
  concurrency?: Partial<PolicyConfig['concurrency']>;
  circuitBreaker?: Partial<PolicyConfig['circuitBreaker']>;
  rateLimit?: Partial<PolicyConfig['rateLimit']>;
};

export type PartialDeepContextPolicy = {
  workingMemory?: Partial<ContextPolicy['workingMemory']>;
  sessionMemory?: Partial<ContextPolicy['sessionMemory']>;
  longTermMemory?: Partial<ContextPolicy['longTermMemory']>;
  vectorMemory?: Partial<ContextPolicy['vectorMemory']>;
  compaction?: ContextPolicy['compaction'];
};

export type YamlFlow =
  | { type: 'sequential'; order?: string[] }
  | {
      type: 'parallel';
      units: string[];
      reducer: string;
      failureStrategy?: FailureStrategy;
    }
  | { type: 'router'; routerUnit: string; routes: Record<string, string> }
  | { type: 'loop'; unit: string; maxIterations?: number; untilStateKey?: string }
  | {
      type: 'dag';
      planner: string;
      aggregator: string;
      executors: string[];
      dependencies?: Record<string, string[]>;
    }
  | { type: 'delegation'; orchestrator: string; specialists: string[] };

export type UnitPluginResult = RuntimeAdapter | WorkflowUnit;

export type UnitPlugin =
  | UnitPluginResult
  | ((config?: Record<string, unknown>) => UnitPluginResult | Promise<UnitPluginResult>);

export type UnitPluginRegistry = Record<string, UnitPlugin>;

export interface CreateEngineFromYamlOptions {
  registry?: UnitPluginRegistry;
  /**
   * Map non-builtin `uses` names to remote HTTP units.
   * Merged under `registry` (explicit registry wins on key conflicts).
   */
  bindings?: import('./bindings.js').UsesBindings;
  /** Extra engine options forwarded to createWorkflowEngine */
  engineOptions?: import('../core/workflow-engine.js').WorkflowEngineOptions;
}
