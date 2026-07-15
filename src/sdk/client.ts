import type { RunRecord } from '../orchestrator/registry.js';
import {
  createWorkflowEngine,
  type WorkflowEngineOptions,
} from '../core/workflow-engine.js';
import type { WorkflowConfig, WorkflowEngine, WorkflowResult } from '../core/types.js';

export interface UniFlowClientOptions {
  /** When set, all calls go to the remote Orchestrator HTTP API. */
  baseUrl?: string;
  /** Fetch implementation (defaults to global fetch). */
  fetchFn?: typeof fetch;
  /** Headers for remote mode (e.g. auth). */
  headers?: Record<string, string>;
}

/**
 * TypeScript SDK.
 *
 * - With `baseUrl`: remote HTTP client (Phase 2 service mode)
 * - Without `baseUrl`: in-process fallback (Phase 1) via local registries
 */
export class UniFlowClient {
  private baseUrl?: string;
  private fetchFn: typeof fetch;
  private headers: Record<string, string>;
  private localFactories = new Map<
    string,
    () => { config: WorkflowConfig; options?: WorkflowEngineOptions }
  >();
  private localEngines = new Map<string, WorkflowEngine>();
  private localRuns = new Map<string, RunRecord>();
  private defaultOptions: WorkflowEngineOptions;

  constructor(
    options: UniFlowClientOptions = {},
    defaultEngineOptions: WorkflowEngineOptions = {},
  ) {
    this.baseUrl = options.baseUrl?.replace(/\/$/, '');
    this.fetchFn = options.fetchFn ?? fetch;
    this.headers = { 'Content-Type': 'application/json', ...options.headers };
    this.defaultOptions = defaultEngineOptions;
  }

  get mode(): 'remote' | 'in-process' {
    return this.baseUrl ? 'remote' : 'in-process';
  }

  /** Register a workflow for in-process mode. Ignored in remote mode. */
  register(
    workflowId: string,
    factory: () => { config: WorkflowConfig; options?: WorkflowEngineOptions },
  ): void {
    this.localFactories.set(workflowId, factory);
  }

  async health(): Promise<{ ok: boolean; workflows?: string[] }> {
    if (!this.baseUrl) {
      return { ok: true, workflows: [...this.localFactories.keys()] };
    }
    return this.request('GET', '/health');
  }

  /**
   * Validate Workflow YAML against the published JSON Schema (in-process; does not call Orchestrator).
   */
  async validateYaml(source: string): Promise<{ ok: true; workflowId: string }> {
    const { validateWorkflowYamlSource } = await import('../yaml/index.js');
    const { access, readFile } = await import('node:fs/promises');
    const { constants } = await import('node:fs');
    let text = source;
    try {
      await access(source, constants.R_OK);
      text = await readFile(source, 'utf8');
    } catch {
      /* inline YAML */
    }
    const doc = validateWorkflowYamlSource(text);
    return { ok: true, workflowId: doc.metadata.id };
  }

  /**
   * Remote: POST /workflows/from-yaml. Requires baseUrl.
   */
  async loadAndRegister(
    yaml: string,
    bindings?: Record<string, { type: 'http'; endpoint: string; headers?: Record<string, string> }>,
  ): Promise<{ workflowId: string }> {
    if (!this.baseUrl) {
      throw new Error('loadAndRegister requires baseUrl (Orchestrator). Use createEngineFromYaml for in-process.');
    }
    return this.request('POST', '/workflows/from-yaml', { yaml, bindings });
  }

  async startWorkflow(
    workflowId: string,
    input?: Record<string, unknown>,
    opts?: { sync?: boolean },
  ): Promise<RunRecord> {
    if (!this.baseUrl) {
      return this.startLocal(workflowId, input, opts?.sync === true);
    }
    return this.request('POST', `/workflows/${encodeURIComponent(workflowId)}/runs`, {
      input: input ?? {},
      sync: opts?.sync === true,
    });
  }

  async getRun(workflowId: string, runId: string): Promise<RunRecord> {
    if (!this.baseUrl) {
      const record = this.localRuns.get(runId);
      if (!record) throw new Error(`Unknown run: ${runId}`);
      return record;
    }
    return this.request(
      'GET',
      `/workflows/${encodeURIComponent(workflowId)}/runs/${encodeURIComponent(runId)}`,
    );
  }

  async resume(
    workflowId: string,
    runId: string,
    snapshotId?: string,
  ): Promise<RunRecord> {
    if (!this.baseUrl) {
      const engine = this.localEngines.get(runId);
      const record = this.localRuns.get(runId);
      if (!engine || !record) throw new Error(`Unknown run: ${runId}`);
      record.status = 'running';
      try {
        const result = await engine.resume(runId, snapshotId);
        record.result = result;
        record.status = 'completed';
      } catch (err) {
        record.status = 'failed';
        record.error = err instanceof Error ? err.message : String(err);
      }
      record.updatedAt = Date.now();
      return record;
    }
    return this.request(
      'POST',
      `/workflows/${encodeURIComponent(workflowId)}/runs/${encodeURIComponent(runId)}/resume`,
      { snapshotId },
    );
  }

  async respondHITL(
    workflowId: string,
    runId: string,
    approved: boolean,
    responder = 'sdk',
  ): Promise<RunRecord> {
    if (!this.baseUrl) {
      const engine = this.localEngines.get(runId);
      if (!engine) throw new Error(`Unknown run: ${runId}`);
      await engine.respondToHITL(approved, responder);
      return this.resume(workflowId, runId);
    }
    return this.request(
      'POST',
      `/workflows/${encodeURIComponent(workflowId)}/runs/${encodeURIComponent(runId)}/hitl`,
      { approved, responder },
    );
  }

  async searchMemory(
    query: string,
    topK = 5,
  ): Promise<{ results: { id: string; content: string; score?: number }[] }> {
    if (!this.baseUrl) {
      return { results: [] };
    }
    const qs = new URLSearchParams({ q: query, topK: String(topK) });
    return this.request('GET', `/memory/search?${qs}`);
  }

  private async startLocal(
    workflowId: string,
    input?: Record<string, unknown>,
    sync = false,
  ): Promise<RunRecord> {
    const factory = this.localFactories.get(workflowId);
    if (!factory) throw new Error(`Unknown workflow: ${workflowId}`);

    const { config, options } = factory();
    const engine = createWorkflowEngine(config, { ...this.defaultOptions, ...options });
    const runId = engine.getRunId();
    const record: RunRecord = {
      runId,
      workflowId,
      status: 'running',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.localRuns.set(runId, record);
    this.localEngines.set(runId, engine);

    const finish = async (): Promise<void> => {
      try {
        const result: WorkflowResult = await engine.run(input);
        record.result = result;
        record.status = 'completed';
      } catch (err) {
        record.status = 'failed';
        record.error = err instanceof Error ? err.message : String(err);
      }
      record.updatedAt = Date.now();
    };

    if (sync) {
      await finish();
    } else {
      void finish();
    }
    return record;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const res = await this.fetchFn(`${this.baseUrl}${path}`, {
      method,
      headers: this.headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = (await res.json()) as T & { error?: string };
    if (!res.ok) {
      throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
    }
    return data;
  }
}

export function createUniFlowClient(
  options?: UniFlowClientOptions,
  engineOptions?: WorkflowEngineOptions,
): UniFlowClient {
  return new UniFlowClient(options, engineOptions);
}
