import type { AgentOutput, ControlFlow, ControlFlowCursor, FailureStrategy, SharedState, UnitId, WorkflowUnit } from '../types.js';

/**
 * 并行 ControlFlow：同时调度多个 Unit，全部完成后（或按失败策略提前结束）再跑 reducer。
 *
 * 失败策略见 {@link FailureStrategy}。也可由 Workflow YAML 的 `flow.type: parallel` 映射而来。
 */
export class ParallelFlow implements ControlFlow {
  readonly type = 'parallel';

  /**
   * @param units - 可并行执行的 Unit 列表
   * @param reducer - 全部并行 Unit 完成后执行的聚合 Unit
   * @param failureStrategy - 失败策略，默认 `'fail-fast'`
   */
  constructor(
    private units: WorkflowUnit[],
    private reducer: WorkflowUnit,
    private failureStrategy: FailureStrategy = 'fail-fast',
  ) {}

  private completed = new Set<string>();
  private reducing = false;
  private failed = false;

  /**
   * 先返回所有尚未完成的并行 Unit；都完成后返回 reducer（若尚未完成）。
   *
   * @param state - 当前 SharedState
   * @param engineCompleted - 引擎侧已完成 Unit id 集合
   * @returns 本轮可调度的 Unit 列表（可能多个）
   */
  next(state: SharedState, engineCompleted?: Set<UnitId>): WorkflowUnit[] {
    if (this.failed && this.failureStrategy === 'fail-fast') return [];

    const pending = this.units.filter((u) => !this.completed.has(u.id) && !engineCompleted?.has(u.id));
    if (pending.length > 0) return pending;

    if (!this.reducing && this.units.every((u) => this.completed.has(u.id) || engineCompleted?.has(u.id))) {
      if (!engineCompleted?.has(this.reducer.id)) {
        this.reducing = true;
        return [this.reducer];
      }
    }
    return [];
  }

  /**
   * 由引擎在 Unit 成功结束时调用，标记并行分支完成。
   *
   * @param unitId - 已完成的 Unit id
   */
  markCompleted(unitId: UnitId): void {
    this.completed.add(unitId);
  }

  /**
   * 由引擎在 Unit 失败时调用：把错误写入 `state.errors`，并按策略决定是否 fail-fast。
   *
   * @param error - 失败错误
   * @param state - 当前 SharedState（会追加到键 `errors`）
   */
  markFailed(error: Error, state: SharedState): void {
    const errors = (state.get<Error[]>('errors') ?? []) as Error[];
    state.set('errors', [...errors, error]);
    if (this.failureStrategy === 'fail-fast') {
      this.failed = true;
    }
  }

  /**
   * @param state - 当前 SharedState（可读 `aggregated`）
   * @returns fail-fast 已触发，或 reducer 已完成 / `aggregated` 为真
   */
  isComplete(state: SharedState): boolean {
    if (this.failed && this.failureStrategy === 'fail-fast') return true;
    return this.reducing && (this.completed.has(this.reducer.id) || state.get('aggregated') === true);
  }

  /** @returns 可写入检查点的游标（含 `completed` / `reducing` / `failed`） */
  serialize(): ControlFlowCursor {
    return {
      flowType: this.type,
      state: {
        completed: [...this.completed],
        reducing: this.reducing,
        failed: this.failed,
      },
    };
  }

  /**
   * @param cursor - 先前 `serialize()` 的结果
   */
  restore(cursor: ControlFlowCursor): void {
    this.completed = new Set((cursor.state.completed as string[]) ?? []);
    this.reducing = (cursor.state.reducing as boolean) ?? false;
    this.failed = (cursor.state.failed as boolean) ?? false;
  }
}

/**
 * 路由 ControlFlow：先跑 router Unit，再根据路由键调度对应 handler。
 *
 * 路由键由 `routeExtractor` 从 router 的 {@link AgentOutput} 取出，并写入 `router.selectedKey`。
 * 也可由 Workflow YAML 的 `flow.type: router` 映射而来。
 */
export class RouterFlow implements ControlFlow {
  readonly type = 'router';

  /**
   * @param router - 负责产出路由决策的 Unit
   * @param handlers - 路由键 → handler Unit 的映射
   * @param routeExtractor - 从 router 输出提取路由键（字符串）
   */
  constructor(
    private router: WorkflowUnit,
    private handlers: Map<string, WorkflowUnit>,
    private routeExtractor: (output: AgentOutput) => string,
  ) {}

  private routed = false;
  private selectedKey: string | null = null;

  /**
   * 未路由时返回 router；已选键后返回对应 handler（若尚未完成）。
   *
   * @param state - 当前 SharedState（可读 `router.selectedKey`、`handler.<key>.done`）
   * @param completedUnits - 引擎侧已完成 Unit id 集合
   * @returns 下一轮要执行的 Unit 列表（0 或 1 个）
   */
  next(state: SharedState, completedUnits?: Set<UnitId>): WorkflowUnit[] {
    if (!this.routed) {
      if (completedUnits?.has(this.router.id)) {
        const key = state.get<string>('router.selectedKey');
        if (key) {
          this.routed = true;
          this.selectedKey = key;
        }
      }
      if (!this.routed) return [this.router];
    }
    if (this.selectedKey) {
      const handler = this.handlers.get(this.selectedKey);
      if (handler && !state.get(`handler.${this.selectedKey}.done`) && !completedUnits?.has(handler.id)) {
        return [handler];
      }
    }
    return [];
  }

  /**
   * 由引擎在 router Unit 完成后调用：提取路由键并写入 SharedState。
   *
   * @param output - router 的 AgentOutput
   * @param state - 当前 SharedState（写入 `router.selectedKey`）
   */
  onRouterComplete(output: AgentOutput, state: SharedState): void {
    this.routed = true;
    this.selectedKey = this.routeExtractor(output);
    state.set('router.selectedKey', this.selectedKey);
  }

  /**
   * @param unitId - 待判定的 Unit id
   * @returns 是否为 router Unit
   */
  isRouterUnit(unitId: UnitId): boolean {
    return this.router.id === unitId;
  }

  /**
   * @param unitId - 待判定的 Unit id
   * @returns 是否为任一 handler Unit
   */
  isHandlerUnit(unitId: UnitId): boolean {
    return [...this.handlers.values()].some((h) => h.id === unitId);
  }

  /**
   * @param state - 当前 SharedState
   * @returns 已选路由键且对应 `handler.<key>.done` 为真
   */
  isComplete(state: SharedState): boolean {
    return (
      this.selectedKey !== null &&
      state.get(`handler.${this.selectedKey}.done`) === true
    );
  }

  /** @returns 可写入检查点的游标（含 `routed` / `selectedKey`） */
  serialize(): ControlFlowCursor {
    return {
      flowType: this.type,
      state: { routed: this.routed, selectedKey: this.selectedKey },
    };
  }

  /**
   * @param cursor - 先前 `serialize()` 的结果
   */
  restore(cursor: ControlFlowCursor): void {
    this.routed = (cursor.state.routed as boolean) ?? false;
    this.selectedKey = (cursor.state.selectedKey as string | null) ?? null;
  }
}
