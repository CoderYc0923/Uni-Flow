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

/** 一次运行的生命周期状态。 */
export type RunStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed';

/**
 * Orchestrator 内存中的运行记录（含可选结果与错误）。
 */
export interface RunRecord {
  /** 运行 id（与 Engine `getRunId()` 一致）。 */
  runId: string;
  /** 所属工作流 id。 */
  workflowId: string;
  /** 当前状态。 */
  status: RunStatus;
  /** 创建时间戳（ms）。 */
  createdAt: number;
  /** 最近更新时间戳（ms）。 */
  updatedAt: number;
  /** 成功或暂停时的结果。 */
  result?: WorkflowResult;
  /** 失败时的错误信息。 */
  error?: string;
}

/** 工作流工厂的返回值：配置 + 可选引擎选项。 */
export type WorkflowFactoryResult = {
  config: WorkflowConfig;
  options?: WorkflowEngineOptions;
};

/** 惰性构造工作流配置的工厂（可异步）。 */
export type WorkflowFactory = () => WorkflowFactoryResult | Promise<WorkflowFactoryResult>;

/**
 * 进程内工作流注册表：保存工厂与进行中的 Engine / RunRecord。
 *
 * 注册信息仅在进程内存中；Orchestrator 重启后需重新 `register` / `registerFromYaml`。
 */
export class WorkflowRegistry {
  private factories = new Map<string, WorkflowFactory>();
  private runs = new Map<string, RunRecord>();
  private engines = new Map<string, WorkflowEngine>();
  private defaultOptions: WorkflowEngineOptions;

  /**
   * @param defaultOptions - 创建 Engine 时的默认 Layer4 / 策略选项
   */
  constructor(defaultOptions: WorkflowEngineOptions = {}) {
    this.defaultOptions = defaultOptions;
  }

  /**
   * 注册工作流工厂。
   *
   * @param workflowId - 工作流 id
   * @param factory - 返回 config / options 的工厂
   */
  register(workflowId: string, factory: WorkflowFactory): void {
    this.factories.set(workflowId, factory);
  }

  /**
   * 校验 YAML、解析 bindings，并以 `metadata.id` 注册；每次 run 重新构建配置以刷新 ControlFlow 游标。
   *
   * @param yaml - Workflow YAML 文本
   * @param bindings - 可选 HTTP `uses` 绑定
   * @returns 注册后的 `workflowId`
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

  /** 是否已注册该工作流。 */
  has(workflowId: string): boolean {
    return this.factories.has(workflowId);
  }

  /** 列出已注册工作流 id。 */
  listWorkflows(): string[] {
    return [...this.factories.keys()];
  }

  /** 按 runId 查询运行记录。 */
  getRun(runId: string): RunRecord | undefined {
    return this.runs.get(runId);
  }

  /** 按 runId 取仍存活的 Engine（若有）。 */
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

  /**
   * 异步启动一次运行（立即返回 `running` 的 RunRecord，后台执行 `engine.run`）。
   *
   * @param workflowId - 已注册工作流
   * @param input - 写入 SharedState 的初始输入
   * @returns 新建的运行记录
   */
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

  /**
   * 同步启动并等待运行结束（或暂停于 HITL）。
   *
   * @param workflowId - 已注册工作流
   * @param input - 初始 SharedState 输入
   * @returns 完成后的运行记录
   */
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

  /**
   * 从检查点恢复指定 run。
   *
   * @param runId - 运行 id
   * @param snapshotId - 可选快照 id
   * @returns 更新后的运行记录
   */
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

  /**
   * 响应 HITL 并继续 resume。
   *
   * @param runId - 运行 id
   * @param approved - 是否批准
   * @param responder - 审批人标识
   * @returns 继续执行后的运行记录
   */
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

/**
 * 创建进程内 {@link WorkflowRegistry}。
 *
 * @param defaultOptions - 默认引擎选项
 * @returns 注册表实例
 */
export function createWorkflowRegistry(
  defaultOptions?: WorkflowEngineOptions,
): WorkflowRegistry {
  return new WorkflowRegistry(defaultOptions);
}

export { YamlLoadError, YamlValidationError };
export type { UsesBindings };
