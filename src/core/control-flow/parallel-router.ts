import type { AgentOutput, ControlFlow, ControlFlowCursor, FailureStrategy, SharedState, UnitId, WorkflowUnit } from '../types.js';

export class ParallelFlow implements ControlFlow {
  readonly type = 'parallel';

  constructor(
    private units: WorkflowUnit[],
    private reducer: WorkflowUnit,
    private failureStrategy: FailureStrategy = 'fail-fast',
  ) {}

  private completed = new Set<string>();
  private reducing = false;
  private failed = false;

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

  markCompleted(unitId: UnitId): void {
    this.completed.add(unitId);
  }

  markFailed(error: Error, state: SharedState): void {
    const errors = (state.get<Error[]>('errors') ?? []) as Error[];
    state.set('errors', [...errors, error]);
    if (this.failureStrategy === 'fail-fast') {
      this.failed = true;
    }
  }

  isComplete(state: SharedState): boolean {
    if (this.failed && this.failureStrategy === 'fail-fast') return true;
    return this.reducing && (this.completed.has(this.reducer.id) || state.get('aggregated') === true);
  }

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

  restore(cursor: ControlFlowCursor): void {
    this.completed = new Set((cursor.state.completed as string[]) ?? []);
    this.reducing = (cursor.state.reducing as boolean) ?? false;
    this.failed = (cursor.state.failed as boolean) ?? false;
  }
}

export class RouterFlow implements ControlFlow {
  readonly type = 'router';

  constructor(
    private router: WorkflowUnit,
    private handlers: Map<string, WorkflowUnit>,
    private routeExtractor: (output: AgentOutput) => string,
  ) {}

  private routed = false;
  private selectedKey: string | null = null;

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

  onRouterComplete(output: AgentOutput, state: SharedState): void {
    this.routed = true;
    this.selectedKey = this.routeExtractor(output);
    state.set('router.selectedKey', this.selectedKey);
  }

  isRouterUnit(unitId: UnitId): boolean {
    return this.router.id === unitId;
  }

  isHandlerUnit(unitId: UnitId): boolean {
    return [...this.handlers.values()].some((h) => h.id === unitId);
  }

  isComplete(state: SharedState): boolean {
    return (
      this.selectedKey !== null &&
      state.get(`handler.${this.selectedKey}.done`) === true
    );
  }

  serialize(): ControlFlowCursor {
    return {
      flowType: this.type,
      state: { routed: this.routed, selectedKey: this.selectedKey },
    };
  }

  restore(cursor: ControlFlowCursor): void {
    this.routed = (cursor.state.routed as boolean) ?? false;
    this.selectedKey = (cursor.state.selectedKey as string | null) ?? null;
  }
}
