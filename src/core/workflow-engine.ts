import { RouterFlow, ParallelFlow } from './control-flow/index.js';
import { approveHITL, isHITLPending } from './hitl-gate.js';
import { createMessageBus } from './message-bus.js';
import { createSharedState, InMemorySharedState } from './shared-state.js';
import type {
  ControlFlow,
  MessageBus,
  SharedState,
  UnitId,
  WorkflowConfig,
  WorkflowEngine,
  WorkflowResult,
  WorkflowUnit,
} from './types.js';
import {
  createCheckpointStore,
  createContextManager,
  createObservability,
  createPolicyEngine,
  createSecurityGovernance,
  DEFAULT_CONTEXT_POLICY,
  DEFAULT_POLICY_CONFIG,
} from '../layer4/index.js';
import type {
  CheckpointStore,
  ContextManager,
  Observability,
  PolicyConfig,
  PolicyEngine,
  SecurityGovernance,
} from '../layer4/types.js';

/**
 * {@link createWorkflowEngine} 的可选依赖与策略配置。
 * 未提供的 Layer4 组件会使用内存/默认实现。
 */
export interface WorkflowEngineOptions {
  /** 上下文组装与记录；默认 `createContextManager()`。 */
  contextManager?: ContextManager;
  /** 检查点存储；默认内存实现，用于 `resume`。 */
  checkpointStore?: CheckpointStore;
  /** 可观测性（span / 日志 / 成本）；默认空实现。 */
  observability?: Observability;
  /** 策略引擎；若未传则按 `policyConfig` 创建。 */
  policyEngine?: PolicyEngine;
  /** 安全治理（pre/post hook、HITL）；默认按 `caller` 放行。 */
  security?: SecurityGovernance;
  /** 传给默认策略引擎的局部 `PolicyConfig`（重试、超时、预算等）。 */
  policyConfig?: Partial<PolicyConfig>;
  /** 调用方身份（id + roles），供安全钩子使用；默认 `system` / `admin`。 */
  caller?: { id: string; roles: string[] };
}

let runCounter = 0;

/**
 * 默认工作流引擎实现：按 ControlFlow 调度 Unit，串联 Layer4（策略、上下文、检查点、安全、可观测性）。
 * 一般通过 {@link createWorkflowEngine} 或 {@link createEngineFromYaml} 获取，无需直接 `new`。
 */
export class DefaultWorkflowEngine implements WorkflowEngine {
  private config: WorkflowConfig;
  private messageBus: MessageBus;
  private sharedState: SharedState;
  private contextManager: ContextManager;
  private checkpointStore: CheckpointStore;
  private observability: Observability;
  private policyEngine: PolicyEngine;
  private security: SecurityGovernance;
  private runId: string;
  private workflowId: string;
  private completedUnits = new Set<UnitId>();
  private startTime = Date.now();
  private paused = false;
  private totalTokens = 0;
  private totalCost = 0;
  private caller: { id: string; roles: string[] };

  /**
   * @param config - 工作流配置（units、controlFlow、可选 sharedState / messageBus）
   * @param options - Layer4 依赖与策略覆盖
   */
  constructor(config: WorkflowConfig, options: WorkflowEngineOptions = {}) {
    this.config = config;
    this.workflowId = config.workflowId;
    this.messageBus = config.messageBus ?? createMessageBus();
    this.sharedState = config.sharedState ?? createSharedState();
    this.contextManager = options.contextManager ?? createContextManager();
    this.checkpointStore = options.checkpointStore ?? createCheckpointStore();
    this.observability = options.observability ?? createObservability();
    this.policyEngine = options.policyEngine ?? createPolicyEngine(options.policyConfig);
    this.security =
      options.security ??
      createSecurityGovernance({ caller: options.caller ?? { id: 'system', roles: ['admin'] } });
    this.runId = `run-${++runCounter}-${Date.now()}`;
    this.caller = options.caller ?? { id: 'system', roles: ['admin'] };
  }

  /**
   * 启动一次新运行：将 `input` 写入 SharedState 后进入调度循环。
   *
   * @param input - 初始状态键值（常见：`task`、`context`、`params`）
   * @returns 运行结果（`runId`、`completedUnits`、`state` 快照等）
   */
  async run(input?: Record<string, unknown>): Promise<WorkflowResult> {
    if (input) {
      for (const [k, v] of Object.entries(input)) {
        this.sharedState.set(k, v);
      }
    }
    return this.executeLoop();
  }

  /**
   * 从检查点恢复指定 `runId` 的运行（可选指定 `snapshotId`）。
   *
   * @param runId - 先前运行的 ID
   * @param snapshotId - 可选快照 ID；省略则由存储选择最新/默认
   * @returns 恢复后继续执行得到的结果
   * @throws 找不到检查点时抛出错误
   */
  async resume(runId: string, snapshotId?: string): Promise<WorkflowResult> {
    const snapshot = await this.checkpointStore.load(runId, snapshotId);
    if (!snapshot) {
      throw new Error(`No checkpoint found for run: ${runId}`);
    }

    this.runId = runId;
    this.completedUnits = new Set(snapshot.completedUnits);
    this.totalTokens = snapshot.metadata.tokenUsage;
    this.totalCost = snapshot.metadata.cost;
    this.startTime = Date.now() - snapshot.metadata.duration;

    if (this.sharedState instanceof InMemorySharedState) {
      this.sharedState.restore(snapshot.sharedState);
    }

    this.config.controlFlow.restore(snapshot.controlFlowCursor);
    this.paused = false;

    if (snapshot.pendingHITL) {
      this.sharedState.set('hitl.pending', true);
    }

    return this.executeLoop();
  }

  /**
   * 向正在执行的目标 Unit 注入 steering 内容（运行时纠偏）。
   *
   * @param targetUnitId - 目标 Unit ID
   * @param content - steering 文本
   */
  steer(targetUnitId: UnitId, content: string): void {
    const unit = this.config.units.get(targetUnitId);
    unit?.runtime.steer(content);
    this.messageBus.publish({
      type: 'steering',
      targetUnitId,
      content,
      timestamp: Date.now(),
    });
  }

  /**
   * 向目标 Unit 发送 follow-up 内容（追加指令）。
   *
   * @param targetUnitId - 目标 Unit ID
   * @param content - follow-up 文本
   */
  followUp(targetUnitId: UnitId, content: string): void {
    const unit = this.config.units.get(targetUnitId);
    unit?.runtime.followUp(content);
    this.messageBus.publish({
      type: 'followup',
      targetUnitId,
      content,
      timestamp: Date.now(),
    });
  }

  /**
   * 响应人工确认（HITL）：批准或拒绝后解除暂停，继续调度。
   *
   * @param approved - 是否批准
   * @param responder - 操作者标识（写入状态供审计）
   */
  async respondToHITL(approved: boolean, responder: string): Promise<void> {
    if (approved) {
      approveHITL(this.sharedState, responder);
    } else {
      this.sharedState.set('hitl.approved', false);
      this.sharedState.set('hitl.responder', responder);
      this.sharedState.set('hitl.pending', false);
    }
    await this.messageBus.publishSync({
      type: 'hitl-response',
      approved,
      responder,
      timestamp: Date.now(),
    });
    this.paused = false;
  }

  /**
   * 获取当前 SharedState 句柄（可读写运行时状态）。
   *
   * @returns 共享状态实例
   */
  getState(): SharedState {
    return this.sharedState;
  }

  /**
   * 获取 MessageBus 历史消息快照。
   *
   * @returns 已发布的工作流消息列表
   */
  getMessages(): ReturnType<MessageBus['history']> {
    return this.messageBus.history();
  }

  /**
   * 获取当前运行的 `runId`。
   *
   * @returns 运行 ID 字符串
   */
  getRunId(): string {
    return this.runId;
  }

  private async executeLoop(): Promise<WorkflowResult> {
    const rootSpan = this.observability.startSpan('workflow', undefined);
    rootSpan.attributes['workflow.id'] = this.workflowId;
    rootSpan.attributes['run.id'] = this.runId;

    try {
      while (!this.config.controlFlow.isComplete(this.sharedState)) {
        if (this.paused || isHITLPending(this.sharedState)) {
          await this.saveCheckpoint({ pendingHITL: this.sharedState.get('hitl.request') });
          break;
        }

        const preDecision = this.policyEngine.preCheck({
          runId: this.runId,
          unitId: '*',
          attempt: 1,
          totalTokens: this.totalTokens,
          totalCost: this.totalCost,
          startTime: this.startTime,
        });

        if (preDecision.action === 'abort') {
          this.observability.log('error', preDecision.reason, { runId: this.runId });
          break;
        }
        if (preDecision.action === 'pause') {
          this.paused = true;
          await this.saveCheckpoint();
          break;
        }

        const nextUnits = this.config.controlFlow.next(this.sharedState, this.completedUnits);
        if (nextUnits.length === 0) break;

        const results = await Promise.allSettled(
          nextUnits.map((unit) => this.executeUnit(unit)),
        );

        for (let i = 0; i < results.length; i++) {
          const result = results[i]!;
          const unit = nextUnits[i]!;
          if (result.status === 'rejected') {
            const flow = this.config.controlFlow;
            if (flow instanceof ParallelFlow) {
              flow.markFailed(result.reason as Error, this.sharedState);
            } else {
              throw result.reason;
            }
          }
        }
      }

      this.observability.endSpan(rootSpan, 'ok');
      return this.buildResult();
    } catch (err) {
      this.observability.endSpan(rootSpan, 'error');
      this.observability.log('error', 'Workflow failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      await this.saveCheckpoint();
      throw err;
    }
  }

  private async executeUnit(unit: WorkflowUnit): Promise<void> {
    const policy = { ...DEFAULT_POLICY_CONFIG, ...unit.policyOverrides };
    const unitSpan = this.observability.startSpan(`unit:${unit.id}`);
    unitSpan.attributes['framework.name'] = unit.runtime.frameworkInfo().name;

    let attempt = 0;
    while (attempt < policy.retry.maxAttempts) {
      attempt++;
      const abortController = new AbortController();
      const timeout = setTimeout(() => abortController.abort(), policy.timeout.unitMs);

      try {
        const contextPolicy = unit.contextPolicy ?? DEFAULT_CONTEXT_POLICY;
        const assembledContext = await this.contextManager.assemble(unit.id, contextPolicy, this.runId);
        const input = unit.inputAdapter(this.sharedState, assembledContext);

        const secDecision = this.security.preHook({
          caller: this.caller,
          unitId: unit.id,
          tools: unit.tools ?? [],
          input,
          secrets: {},
        });

        if (secDecision.action === 'deny') {
          throw new Error(secDecision.reason);
        }
        if (secDecision.action === 'require-hitl') {
          this.sharedState.set('hitl.pending', true);
          this.sharedState.set('hitl.request', {
            unitId: unit.id,
            action: secDecision.hitlAction,
            payload: secDecision.payload,
          });
          await this.messageBus.publishSync({
            type: 'hitl-request',
            unitId: unit.id,
            action: secDecision.hitlAction,
            payload: secDecision.payload,
            timestamp: Date.now(),
          });
          this.paused = true;
          clearTimeout(timeout);
          return;
        }

        const output = await unit.runtime.execute(input, {
          workflowId: this.workflowId,
          runId: this.runId,
          unitId: unit.id,
          traceId: unitSpan.traceId,
          assembledContext,
          secrets: {},
          abortSignal: abortController.signal,
        });

        const { output: sanitized } = this.security.postHook(
          { caller: this.caller, unitId: unit.id, tools: unit.tools ?? [], input, secrets: {} },
          output,
        );

        unit.outputAdapter(sanitized, this.sharedState);
        await this.contextManager.record(unit.id, input, sanitized, this.runId);

        if (sanitized.tokenUsage) {
          this.totalTokens += sanitized.tokenUsage.totalTokens;
          this.totalCost += sanitized.tokenUsage.estimatedCost ?? 0;
          this.observability.recordCost(unit.id, sanitized.tokenUsage);
          await this.messageBus.publish({
            type: 'cost-update',
            unitId: unit.id,
            tokens: sanitized.tokenUsage.totalTokens,
            cost: sanitized.tokenUsage.estimatedCost ?? 0,
            timestamp: Date.now(),
          });
        }

        this.completedUnits.add(unit.id);

        this.policyEngine.onComplete(sanitized, {
          runId: this.runId,
          unitId: unit.id,
          attempt,
          totalTokens: this.totalTokens,
          totalCost: this.totalCost,
          startTime: this.startTime,
        });

        this.handleControlFlowCallbacks(unit, sanitized);

        await this.messageBus.publish({
          type: 'unit-output',
          sourceUnitId: unit.id,
          data: sanitized,
          timestamp: Date.now(),
        });

        await this.saveCheckpoint();
        this.observability.endSpan(unitSpan, 'ok');
        clearTimeout(timeout);
        return;
      } catch (err) {
        clearTimeout(timeout);
        const error = err instanceof Error ? err : new Error(String(err));
        const decision = this.policyEngine.onError(error, {
          runId: this.runId,
          unitId: unit.id,
          attempt,
          totalTokens: this.totalTokens,
          totalCost: this.totalCost,
          startTime: this.startTime,
          error,
        });

        if (decision.action === 'retry') {
          await sleep(decision.delayMs);
          continue;
        }
        if (decision.action === 'skip') return;
        this.observability.endSpan(unitSpan, 'error');
        throw error;
      }
    }
  }

  private handleControlFlowCallbacks(unit: WorkflowUnit, output: import('./types.js').AgentOutput): void {
    const flow = this.config.controlFlow;
    if (flow instanceof RouterFlow) {
      if (flow.isRouterUnit(unit.id)) {
        flow.onRouterComplete(output, this.sharedState);
      } else if (flow.isHandlerUnit(unit.id)) {
        const key = this.sharedState.get<string>('router.selectedKey');
        if (key) {
          this.sharedState.set(`handler.${key}.done`, true);
        }
      }
    }
    if (flow instanceof ParallelFlow) {
      flow.markCompleted(unit.id);
    }
  }

  private async saveCheckpoint(extra?: { pendingHITL?: unknown }): Promise<void> {
    const snapshotId = await this.checkpointStore.save(this.runId, {
      runId: this.runId,
      workflowId: this.workflowId,
      timestamp: Date.now(),
      sharedState: this.sharedState.snapshot(),
      controlFlowCursor: this.config.controlFlow.serialize(),
      completedUnits: [...this.completedUnits],
      messageBusHistory: this.messageBus.history(),
      pendingHITL: extra?.pendingHITL as import('../layer4/types.js').HITLRequest | undefined,
      metadata: {
        duration: Date.now() - this.startTime,
        cost: this.totalCost,
        tokenUsage: this.totalTokens,
      },
    });

    await this.messageBus.publish({
      type: 'checkpoint',
      runId: this.runId,
      snapshotId,
      timestamp: Date.now(),
    });
  }

  private buildResult(): WorkflowResult {
    return {
      state: this.sharedState.snapshot(),
      messages: this.messageBus.history(),
      completedUnits: [...this.completedUnits],
      duration: Date.now() - this.startTime,
      runId: this.runId,
      tokenUsage: this.totalTokens,
      cost: this.totalCost,
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 代码路径入口：用已组装的 `WorkflowConfig` 创建 `WorkflowEngine`。
 * 适合测试、Composite 等 YAML v1 难以表达的拓扑；生产编排优先 {@link createEngineFromYaml}。
 *
 * @param config - 含 `workflowId`、`units`、`controlFlow` 的配置
 * @param options - 可选 Layer4 依赖与策略
 * @returns 可调用 `run()` / `resume()` 的引擎实例
 *
 * @example
 * ```ts
 * import {
 *   createWorkflowEngine,
 *   createSharedState,
 *   SequentialFlow,
 *   createMockAdapter,
 * } from 'uni-flow';
 *
 * const echo = {
 *   id: 'echo',
 *   runtime: createMockAdapter({ content: 'hi' }),
 *   terminationPolicy: { type: 'stop-reason', reasons: ['stop'] },
 *   inputAdapter: (s) => ({ task: String(s.get('task') ?? '') }),
 *   outputAdapter: (out, s) => s.set('output.echo', out.content),
 * };
 * const units = new Map([[echo.id, echo]]);
 * const engine = createWorkflowEngine({
 *   workflowId: 'demo',
 *   units,
 *   controlFlow: new SequentialFlow([echo]),
 *   sharedState: createSharedState(),
 * });
 * await engine.run({ task: 'ping' });
 * ```
 */
export function createWorkflowEngine(
  config: WorkflowConfig,
  options?: WorkflowEngineOptions,
): WorkflowEngine {
  return new DefaultWorkflowEngine(config, options);
}
