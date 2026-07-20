import type { AgentOutput, ControlFlow, ControlFlowCursor, SharedState, UnitId, WorkflowUnit } from '../types.js';

/**
 * DAG ControlFlow：planner 产出计划后，按依赖图调度 executor，最后跑 aggregator。
 *
 * 就绪步骤由 `dependencies`（stepId → 前置 stepId 列表）决定；完成集合来自
 * SharedState 的 `completedSteps` 与引擎的 `completedUnits`。
 * 也可由 Workflow YAML 的 `flow.type: dag` 映射而来。
 */
export class DAGFlow implements ControlFlow {
  readonly type = 'dag';

  /**
   * @param planner - 负责写入计划（如键 `plan`）的 Unit
   * @param executors - stepId → 执行该步的 Unit
   * @param aggregator - 所有步骤完成后执行的聚合 Unit
   * @param dependencies - stepId → 其依赖的 stepId 列表（无依赖则为空数组 / 缺省）
   */
  constructor(
    private planner: WorkflowUnit,
    private executors: Map<string, WorkflowUnit>,
    private aggregator: WorkflowUnit,
    private dependencies: Map<string, string[]>,
  ) {}

  /**
   * 无计划时调度 planner；否则调度所有依赖已满足的 executor；都完成后调度 aggregator。
   *
   * @param state - 当前 SharedState（可读 `plan` / `completedSteps` / `aggregated`）
   * @param completedUnits - 引擎侧已完成 Unit id 集合
   * @returns 本轮可调度的 Unit 列表（可能多个并行步骤）
   */
  next(state: SharedState, completedUnits?: Set<UnitId>): WorkflowUnit[] {
    const plan = state.get('plan');
    if (!plan) {
      if (completedUnits?.has(this.planner.id)) {
        // planner done but no plan - wait
      } else {
        return [this.planner];
      }
    }

    const ready = this.getReadySteps(state, completedUnits);
    if (ready.length > 0) {
      return ready.map((s) => this.executors.get(s)!);
    }

    if (this.allStepsDone(state, completedUnits) && !state.get('aggregated')) {
      if (!completedUnits?.has(this.aggregator.id)) {
        return [this.aggregator];
      }
    }
    return [];
  }

  /**
   * @param state - 当前 SharedState
   * @returns 键 `aggregated` 是否为 `true`
   */
  isComplete(state: SharedState): boolean {
    return state.get('aggregated') === true;
  }

  private getReadySteps(state: SharedState, completedUnits?: Set<UnitId>): string[] {
    const done = this.getDoneSet(state, completedUnits);
    return [...this.executors.keys()].filter(
      (stepId) =>
        !done.has(stepId) &&
        (this.dependencies.get(stepId) || []).every((dep) => done.has(dep)),
    );
  }

  private allStepsDone(state: SharedState, completedUnits?: Set<UnitId>): boolean {
    const done = this.getDoneSet(state, completedUnits);
    return done.size >= this.executors.size;
  }

  private getDoneSet(state: SharedState, completedUnits?: Set<UnitId>): Set<string> {
    const done = new Set<string>(state.get('completedSteps') as Set<string> | undefined);
    if (completedUnits) {
      for (const [stepId, unit] of this.executors) {
        if (completedUnits.has(unit.id)) done.add(stepId);
      }
    }
    return done;
  }

  /** @returns 游标（DAG 进度主要落在 SharedState，此处 `state` 为空对象） */
  serialize(): ControlFlowCursor {
    return { flowType: this.type, state: {} };
  }

  /** @param _cursor - 先前游标（本实现无本地字段可恢复） */
  restore(_cursor: ControlFlowCursor): void {}
}

/**
 * 委托 ControlFlow：orchestrator 决定委托目标，再依次跑 specialist，最后回到 orchestrator 收尾。
 *
 * 委托列表来自 orchestrator 输出的 `metadata.delegations`（含 `targetUnitId`）。
 * 完成标志为 SharedState 键 `orchestrator.finalized === true`。
 * 也可由 Workflow YAML 的 `flow.type: delegation` 映射而来。
 */
export class DelegationFlow implements ControlFlow {
  readonly type = 'delegation';

  /**
   * @param orchestrator - 编排 / 收尾 Unit（可多次被调度）
   * @param specialists - specialist id → Unit（id 需与 `targetUnitId` 对应）
   */
  constructor(
    private orchestrator: WorkflowUnit,
    private specialists: Map<string, WorkflowUnit>,
  ) {}

  private delegationQueue: string[] = [];
  private phase: 'orchestrating' | 'executing' | 'finalizing' = 'orchestrating';

  /**
   * 按 phase 调度：orchestrating → executing（队列中的 specialist）→ finalizing（再跑 orchestrator）。
   *
   * @param state - 当前 SharedState（可读 `orchestrator.finalized`）
   * @param completedUnits - 引擎侧已完成 Unit id 集合
   * @returns 下一轮要执行的 Unit 列表（0 或 1 个）
   */
  next(state: SharedState, completedUnits?: Set<UnitId>): WorkflowUnit[] {
    if (state.get('orchestrator.finalized') === true) return [];

    if (this.phase === 'orchestrating') {
      if (completedUnits?.has(this.orchestrator.id) && this.delegationQueue.length > 0) {
        this.phase = 'executing';
      } else if (!completedUnits?.has(this.orchestrator.id)) {
        return [this.orchestrator];
      }
    }

    if (this.phase === 'executing') {
      const next = this.delegationQueue.shift();
      if (next) {
        const specialist = this.specialists.get(next);
        if (specialist && !completedUnits?.has(specialist.id)) {
          return [specialist];
        }
      }
      this.phase = 'finalizing';
      if (!completedUnits?.has(this.orchestrator.id)) {
        return [this.orchestrator];
      }
    }

    return [];
  }

  /**
   * 由引擎在 orchestrator 产出后调用：解析 `metadata.delegations` 并进入 executing。
   *
   * @param output - orchestrator 的 AgentOutput
   */
  onOrchestratorOutput(output: AgentOutput): void {
    const delegations = (output.metadata.delegations as { targetUnitId: string }[]) ?? [];
    if (delegations.length > 0) {
      this.delegationQueue = delegations.map((d) => d.targetUnitId);
      this.phase = 'executing';
    }
  }

  /**
   * @param state - 当前 SharedState
   * @returns `orchestrator.finalized` 是否为 `true`
   */
  isComplete(state: SharedState): boolean {
    return state.get('orchestrator.finalized') === true;
  }

  /** @returns 可写入检查点的游标（含 `delegationQueue` / `phase`） */
  serialize(): ControlFlowCursor {
    return {
      flowType: this.type,
      state: { delegationQueue: this.delegationQueue, phase: this.phase },
    };
  }

  /**
   * @param cursor - 先前 `serialize()` 的结果
   */
  restore(cursor: ControlFlowCursor): void {
    this.delegationQueue = (cursor.state.delegationQueue as string[]) ?? [];
    this.phase = (cursor.state.phase as typeof this.phase) ?? 'orchestrating';
  }
}

/**
 * 组合 ControlFlow：按顺序串联多个子 Flow；当前子 Flow 未完成前只调度它。
 *
 * YAML v1 若无法表达嵌套拓扑，可在代码路径用本类拼装（见 AGENTS.md 双轨说明）。
 * 本类已从 `src/core/control-flow` 导出。
 */
export class CompositeFlow implements ControlFlow {
  readonly type = 'composite';

  /**
   * @param flows - 按执行顺序排列的子 {@link ControlFlow} 列表
   */
  constructor(private flows: ControlFlow[]) {}

  /**
   * 找到第一个未完成的子 Flow，委托其 `next`。
   *
   * @param state - 当前 SharedState
   * @param completedUnits - 引擎侧已完成 Unit id 集合
   * @returns 当前子 Flow 给出的 Unit 列表
   */
  next(state: SharedState, completedUnits?: Set<UnitId>): WorkflowUnit[] {
    for (const flow of this.flows) {
      if (!flow.isComplete(state)) return flow.next(state, completedUnits);
    }
    return [];
  }

  /**
   * @param state - 当前 SharedState
   * @returns 是否所有子 Flow 均已完成
   */
  isComplete(state: SharedState): boolean {
    return this.flows.every((f) => f.isComplete(state));
  }

  /** @returns 可写入检查点的游标（嵌套各子 Flow 的 serialize 结果） */
  serialize(): ControlFlowCursor {
    return {
      flowType: this.type,
      state: { flows: this.flows.map((f) => f.serialize()) },
    };
  }

  /**
   * @param cursor - 先前 `serialize()` 的结果（`state.flows` 为子游标数组）
   */
  restore(cursor: ControlFlowCursor): void {
    const flows = (cursor.state.flows as ControlFlowCursor[]) ?? [];
    flows.forEach((c, i) => this.flows[i]?.restore(c));
  }
}
