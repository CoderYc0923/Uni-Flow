import type { ControlFlow, ControlFlowCursor, SharedState, UnitId, WorkflowUnit } from '../types.js';

export class LoopFlow implements ControlFlow {
  readonly type = 'loop';

  constructor(
    private unit: WorkflowUnit,
    private maxIterations: number,
    private terminationCondition?: (state: SharedState) => boolean,
  ) {}

  private iterations = 0;

  next(state: SharedState, _completedUnits?: Set<UnitId>): WorkflowUnit[] {
    if (this.iterations >= this.maxIterations) return [];
    if (this.iterations > 0 && this.terminationCondition?.(state)) return [];
    this.iterations++;
    return [this.unit];
  }

  isComplete(state: SharedState): boolean {
    return (
      this.iterations >= this.maxIterations ||
      (this.iterations > 0 && (this.terminationCondition?.(state) ?? false))
    );
  }

  serialize(): ControlFlowCursor {
    return { flowType: this.type, state: { iterations: this.iterations } };
  }

  restore(cursor: ControlFlowCursor): void {
    this.iterations = (cursor.state.iterations as number) ?? 0;
  }
}

export class SequentialFlow implements ControlFlow {
  readonly type = 'sequential';

  constructor(private units: WorkflowUnit[]) {}

  private currentIndex = 0;

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

  isComplete(_state: SharedState): boolean {
    return this.currentIndex >= this.units.length;
  }

  serialize(): ControlFlowCursor {
    return { flowType: this.type, state: { currentIndex: this.currentIndex } };
  }

  restore(cursor: ControlFlowCursor): void {
    this.currentIndex = (cursor.state.currentIndex as number) ?? 0;
  }
}
