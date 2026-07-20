import type { ControlFlow, ControlFlowCursor, SharedState, UnitId, WorkflowUnit } from '../types.js';

/**
 * 循环 ControlFlow：在达到最大次数或满足终止条件前，反复调度同一个 Unit。
 *
 * 典型场景：重试、迭代 refinement、直到 SharedState 出现某标志为止。
 * 也可由 Workflow YAML 的 `flow.type: loop` 映射而来。
 */
export class LoopFlow implements ControlFlow {
  readonly type = 'loop';

  /**
   * @param unit - 每次迭代要执行的 Unit
   * @param maxIterations - 最大迭代次数（含首次）；达到后不再调度
   * @param terminationCondition - 可选终止谓词；在第 2 次及之后的 `next` 中，若返回 `true` 则停止
   */
  constructor(
    private unit: WorkflowUnit,
    private maxIterations: number,
    private terminationCondition?: (state: SharedState) => boolean,
  ) {}

  private iterations = 0;

  /**
   * 若未达上限且未满足终止条件，返回 `[unit]`；否则返回空数组。
   *
   * @param state - 当前 SharedState（供终止条件读取）
   * @param _completedUnits - 引擎侧已完成 Unit 集合（本 Flow 未使用）
   * @returns 下一轮要执行的 Unit 列表（0 或 1 个）
   */
  next(state: SharedState, _completedUnits?: Set<UnitId>): WorkflowUnit[] {
    if (this.iterations >= this.maxIterations) return [];
    if (this.iterations > 0 && this.terminationCondition?.(state)) return [];
    this.iterations++;
    return [this.unit];
  }

  /**
   * @param state - 当前 SharedState
   * @returns 是否已达最大次数，或（至少执行过一次后）终止条件为真
   */
  isComplete(state: SharedState): boolean {
    return (
      this.iterations >= this.maxIterations ||
      (this.iterations > 0 && (this.terminationCondition?.(state) ?? false))
    );
  }

  /** @returns 可写入检查点的游标（含 `iterations`） */
  serialize(): ControlFlowCursor {
    return { flowType: this.type, state: { iterations: this.iterations } };
  }

  /**
   * @param cursor - 先前 `serialize()` 的结果
   */
  restore(cursor: ControlFlowCursor): void {
    this.iterations = (cursor.state.iterations as number) ?? 0;
  }
}

/**
 * 顺序 ControlFlow：按构造时给定的顺序，一次调度一个 Unit。
 *
 * 这是最常用的流水线形态；也可由 Workflow YAML 的 `flow.type: sequential` 映射而来。
 */
export class SequentialFlow implements ControlFlow {
  readonly type = 'sequential';

  /**
   * @param units - 按执行顺序排列的 Unit 列表
   */
  constructor(private units: WorkflowUnit[]) {}

  private currentIndex = 0;

  /**
   * 跳过已在 `completedUnits` 中的 Unit，返回下一个待执行 Unit。
   *
   * @param _state - 当前 SharedState（本 Flow 不读状态做调度）
   * @param completedUnits - 引擎侧已完成 Unit id 集合（用于 resume / 跳过）
   * @returns 下一个 Unit，或空数组表示序列已走完
   */
  next(_state: SharedState, completedUnits?: Set<UnitId>): WorkflowUnit[] {
    while (this.currentIndex < this.units.length) {
      const unit = this.units[this.currentIndex]!;
      if (completedUnits?.has(unit.id)) {
        this.currentIndex++;
        continue;
      }
      this.currentIndex++;
      return [unit];
    }
    return [];
  }

  /**
   * @param _state - 当前 SharedState
   * @returns 是否已推进到序列末尾
   */
  isComplete(_state: SharedState): boolean {
    return this.currentIndex >= this.units.length;
  }

  /** @returns 可写入检查点的游标（含 `currentIndex`） */
  serialize(): ControlFlowCursor {
    return { flowType: this.type, state: { currentIndex: this.currentIndex } };
  }

  /**
   * @param cursor - 先前 `serialize()` 的结果
   */
  restore(cursor: ControlFlowCursor): void {
    this.currentIndex = (cursor.state.currentIndex as number) ?? 0;
  }
}
