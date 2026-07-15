import type { WorkflowConfig, WorkflowEngine, WorkflowResult } from '../core/types.js';
import {
  createWorkflowEngine,
  type WorkflowEngineOptions,
} from '../core/workflow-engine.js';
import {
  createWorkflowConfigFromYaml,
  type UsesBindings,
  YamlLoadError,
  YamlValidationError,
} from '../yaml/index.js';

export type RunStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed';

export interface RunRecord {
  runId: string;
  workflowId: string;
  status: RunStatus;
  createdAt: number;
  updatedAt: number;
  result?: WorkflowResult;
  error?: string;
}

export type WorkflowFactoryResult = {
  config: WorkflowConfig;
  options?: WorkflowEngineOptions;
};

export type WorkflowFactory = () => WorkflowFactoryResult | Promise<WorkflowFactoryResult>;

/**
 * In-process registry that holds workflow factories and live run engines.
 * Factories live in process memory and are lost when the Orchestrator process exits.
 */
export class WorkflowRegistry {
  private factories = new Map<string, WorkflowFactory>();
  private runs = new Map<string, RunRecord>();
  private engines = new Map<string, WorkflowEngine>();
  private defaultOptions: WorkflowEngineOptions;

  constructor(defaultOptions: WorkflowEngineOptions = {}) {
    this.defaultOptions = defaultOptions;
  }

  register(workflowId: string, factory: WorkflowFactory): void {
    this.factories.set(workflowId, factory);
  }

  /**
   * Validate YAML, resolve bindings, and register under metadata.id.
   * Re-building config on each run so ControlFlow cursor state is fresh.
   */
  async registerFromYaml(
    yaml: string,
    bindings?: UsesBindings,
  ): Promise<{ workflowId: string }> {
    const built = await createWorkflowConfigFromYaml(yaml, { bindings });
    const workflowId = built.workflowId;
    this.register(workflowId, () => createWorkflowConfigFromYaml(yaml, { bindings }));
    return { workflowId };
  }

  has(workflowId: string): boolean {
    return this.factories.has(workflowId);
  }

  listWorkflows(): string[] {
    return [...this.factories.keys()];
  }

  getRun(runId: string): RunRecord | undefined {
    return this.runs.get(runId);
  }

  getEngine(runId: string): WorkflowEngine | undefined {
    return this.engines.get(runId);
  }

  private async resolveFactory(workflowId: string): Promise<WorkflowFactoryResult> {
    const factory = this.factories.get(workflowId);
    if (!factory) {
      throw new Error(`Unknown workflow: ${workflowId}`);
    }
    return factory();
  }

  async startRun(
    workflowId: string,
    input?: Record<string, unknown>,
  ): Promise<RunRecord> {
    const { config, options } = await this.resolveFactory(workflowId);
    const engine = createWorkflowEngine(config, { ...this.defaultOptions, ...options });
    const runId = engine.getRunId();

    const record: RunRecord = {
      runId,
      workflowId,
      status: 'running',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.runs.set(runId, record);
    this.engines.set(runId, engine);

    void this.executeAsync(runId, engine, input);
    return record;
  }

  async startRunSync(
    workflowId: string,
    input?: Record<string, unknown>,
  ): Promise<RunRecord> {
    const { config, options } = await this.resolveFactory(workflowId);
    const engine = createWorkflowEngine(config, { ...this.defaultOptions, ...options });
    const runId = engine.getRunId();

    const record: RunRecord = {
      runId,
      workflowId,
      status: 'running',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.runs.set(runId, record);
    this.engines.set(runId, engine);

    try {
      const result = await engine.run(input);
      record.result = result;
      record.status = this.inferPaused(result) ? 'paused' : 'completed';
      record.updatedAt = Date.now();
    } catch (err) {
      record.status = 'failed';
      record.error = err instanceof Error ? err.message : String(err);
      record.updatedAt = Date.now();
    }
    return record;
  }

  async resumeRun(runId: string, snapshotId?: string): Promise<RunRecord> {
    const record = this.runs.get(runId);
    if (!record) {
      throw new Error(`Unknown run: ${runId}`);
    }

    let engine = this.engines.get(runId);
    if (!engine) {
      const { config, options } = await this.resolveFactory(record.workflowId);
      engine = createWorkflowEngine(config, { ...this.defaultOptions, ...options });
      this.engines.set(runId, engine);
    }

    record.status = 'running';
    record.updatedAt = Date.now();

    try {
      const result = await engine.resume(runId, snapshotId);
      record.result = result;
      record.status = this.inferPaused(result) ? 'paused' : 'completed';
      record.updatedAt = Date.now();
    } catch (err) {
      record.status = 'failed';
      record.error = err instanceof Error ? err.message : String(err);
      record.updatedAt = Date.now();
    }
    return record;
  }

  async respondHITL(runId: string, approved: boolean, responder: string): Promise<RunRecord> {
    const engine = this.engines.get(runId);
    const record = this.runs.get(runId);
    if (!engine || !record) {
      throw new Error(`Unknown run: ${runId}`);
    }

    await engine.respondToHITL(approved, responder);
    return this.resumeRun(runId);
  }

  private async executeAsync(
    runId: string,
    engine: WorkflowEngine,
    input?: Record<string, unknown>,
  ): Promise<void> {
    const record = this.runs.get(runId);
    if (!record) return;
    try {
      const result = await engine.run(input);
      record.result = result;
      record.status = this.inferPaused(result) ? 'paused' : 'completed';
      record.updatedAt = Date.now();
    } catch (err) {
      record.status = 'failed';
      record.error = err instanceof Error ? err.message : String(err);
      record.updatedAt = Date.now();
    }
  }

  private inferPaused(result: WorkflowResult): boolean {
    return result.messages.some((m) => m.type === 'hitl-request');
  }
}

export function createWorkflowRegistry(
  defaultOptions?: WorkflowEngineOptions,
): WorkflowRegistry {
  return new WorkflowRegistry(defaultOptions);
}

export { YamlLoadError, YamlValidationError };
export type { UsesBindings };
