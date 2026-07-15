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

export interface WorkflowEngineOptions {
  contextManager?: ContextManager;
  checkpointStore?: CheckpointStore;
  observability?: Observability;
  policyEngine?: PolicyEngine;
  security?: SecurityGovernance;
  policyConfig?: Partial<PolicyConfig>;
  caller?: { id: string; roles: string[] };
}

let runCounter = 0;

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

  async run(input?: Record<string, unknown>): Promise<WorkflowResult> {
    if (input) {
      for (const [k, v] of Object.entries(input)) {
        this.sharedState.set(k, v);
      }
    }
    return this.executeLoop();
  }

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

  getState(): SharedState {
    return this.sharedState;
  }

  getMessages(): ReturnType<MessageBus['history']> {
    return this.messageBus.history();
  }

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

export function createWorkflowEngine(
  config: WorkflowConfig,
  options?: WorkflowEngineOptions,
): WorkflowEngine {
  return new DefaultWorkflowEngine(config, options);
}
