import type { RunRecord } from '../orchestrator/registry.js';

import {
  createWorkflowEngine,
  type WorkflowEngineOptions,
} from '../core/workflow-engine.js';

import type { WorkflowConfig, WorkflowEngine, WorkflowResult } from '../core/types.js';

/**
 * {@link UniFlowClient} 构造选项。
 *
 * - 设置 `baseUrl`：走远程 Orchestrator HTTP API
 * - 不设置 `baseUrl`：进程内模式（本地 register / start）
 */

export interface UniFlowClientOptions {
  /** 远程 Orchestrator 根 URL（无尾斜杠亦可）；设置后所有编排调用走 HTTP。 */
  baseUrl?: string;
  /** `fetch` 实现，默认全局 `fetch`（单测可注入 Mock）。 */
  fetchFn?: typeof fetch;
  /** 远程模式下的额外请求头（如鉴权）。 */
  headers?: Record<string, string>;
}

/**
 * TypeScript SDK 客户端。
 *
 * - 有 `baseUrl`：远程 HTTP 客户端（对接 Orchestrator）
 * - 无 `baseUrl`：进程内回退（本地工厂 + `createWorkflowEngine`）
 *
 * 主流程通常是：`validateYaml` →（远程）`loadAndRegister` 或（本地）`register` → `startWorkflow` → `getRun`。
 *
 * @example
 * ```ts
 * // 进程内：先 register，再同步跑一遍
 * const client = createUniFlowClient();
 * client.register('demo', () => ({ config: myWorkflowConfig }));
 * const run = await client.startWorkflow('demo', { q: 'hi' }, { sync: true });
 *
 * // 远程：校验 YAML 后 from-yaml 注册
 * const remote = createUniFlowClient({ baseUrl: 'http://127.0.0.1:8080' });
 * await remote.validateYaml(yamlText);
 * await remote.loadAndRegister(yamlText, {
 *   'child.unit': { type: 'http', endpoint: 'http://127.0.0.1:4001/execute' },
 * });
 * ```
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
  /**
   * @param options 客户端模式与 HTTP 相关选项
   * @param defaultEngineOptions 进程内创建 Engine 时的默认选项
   */
  constructor(
    options: UniFlowClientOptions = {},
    defaultEngineOptions: WorkflowEngineOptions = {},
  ) {
    this.baseUrl = options.baseUrl?.replace(/\/$/, '');
    this.fetchFn = options.fetchFn ?? fetch;
    this.headers = { 'Content-Type': 'application/json', ...options.headers };
    this.defaultOptions = defaultEngineOptions;
  }
  /** 当前模式：`remote`（有 baseUrl）或 `in-process`。 */
  get mode(): 'remote' | 'in-process' {
    return this.baseUrl ? 'remote' : 'in-process';
  }
  /**
   * 进程内注册工作流工厂；远程模式下调用会被忽略（请用 `loadAndRegister`）。
   *
   * @param workflowId 工作流 id
   * @param factory 返回 `WorkflowConfig` 与可选 Engine options 的工厂
   */
  register(
    workflowId: string,
    factory: () => { config: WorkflowConfig; options?: WorkflowEngineOptions },
  ): void {
    this.localFactories.set(workflowId, factory);
  }
  /**
   * 健康检查。
   *
   * @returns 进程内返回本地已注册 workflow 列表；远程则请求 `GET /health`
   */
  async health(): Promise<{ ok: boolean; workflows?: string[] }> {
    if (!this.baseUrl) {
      return { ok: true, workflows: [...this.localFactories.keys()] };
    }
    return this.request('GET', '/health');
  }
  /**
   * 用已发布的 JSON Schema 校验 Workflow YAML（始终在本地执行，不调用 Orchestrator）。
   *
   * `source` 可以是文件路径或内联 YAML 文本：若路径可读则按文件加载，否则当作 YAML 字符串。
   *
   * @param source 文件路径或 YAML 文本
   * @returns `{ ok: true, workflowId }`，`workflowId` 来自文档 `metadata.id`
   *
   * @example
   * ```ts
   * const client = createUniFlowClient();
   * const { workflowId } = await client.validateYaml('./uniflow.workflow.yaml');
   * ```
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
   * 远程：`POST /workflows/from-yaml`，把 YAML（及可选 HTTP bindings）注册到 Orchestrator。
   * 需要已配置 `baseUrl`；进程内请改用 `createEngineFromYaml` / `register`。
   *
   * @param yaml Workflow YAML 文本
   * @param bindings 可选：`uses` 名 → HTTP Unit 绑定（`type: 'http'` + `endpoint`）
   * @returns 注册后的 `{ workflowId }`
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
  /**
   * 启动一次 run。
   *
   * @param workflowId 已注册的工作流 id
   * @param input 写入初始 SharedState 的输入对象
   * @param opts - 选项；`sync` 为 `true` 时等待跑完再返回（进程内与远程均支持该语义）
   * @returns {@link RunRecord}（含 `runId` / `status` / 可选 `result`）
   */
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
  /**
   * 查询某次 run 状态与结果。
   *
   * @param workflowId 工作流 id
   * @param runId run id
   * @returns 对应的 {@link RunRecord}
   */
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
  /**
   * 从检查点恢复 run。
   *
   * @param workflowId 工作流 id
   * @param runId run id
   * @param snapshotId 可选快照 id
   * @returns 更新后的 {@link RunRecord}
   */
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
  /**
   * 回应 HITL（人工审核）请求；进程内会先 `respondToHITL` 再 `resume`。
   *
   * @param workflowId 工作流 id
   * @param runId run id
   * @param approved 是否批准
   * @param responder 回应者标识（默认 `"sdk"`）
   * @returns 更新后的 {@link RunRecord}
   */
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
  /**
   * 远程记忆检索（`GET /memory/search`）；进程内当前返回空结果列表。
   *
   * @param query 查询文本
   * @param topK 返回条数上限（默认 5）
   * @returns `{ results: [...] }`
   */
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

/**
 * 创建 {@link UniFlowClient}。
 *
 * @param options 客户端选项（`baseUrl` / `fetchFn` / `headers`）
 * @param engineOptions 进程内 Engine 默认选项
 * @returns SDK 客户端实例
 *
 * @example
 * ```ts
 * const client = createUniFlowClient(); // in-process
 * await client.validateYaml('apiVersion: uniflow/v1\n...');
 * ```
 */

export function createUniFlowClient(
  options?: UniFlowClientOptions,
  engineOptions?: WorkflowEngineOptions,
): UniFlowClient {
  return new UniFlowClient(options, engineOptions);
}
