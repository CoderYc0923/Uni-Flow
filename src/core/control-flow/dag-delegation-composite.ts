import type { AgentOutput, ControlFlow, ControlFlowCursor, SharedState, UnitId, WorkflowUnit } from '../types.js';

export class DAGFlow implements ControlFlow {
  readonly type = 'dag';

  constructor(
    private planner: WorkflowUnit,
    private executors: Map<string, WorkflowUnit>,
    private aggregator: WorkflowUnit,
    private dependencies: Map<string, string[]>,
  ) {}

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

  serialize(): ControlFlowCursor {
    return { flowType: this.type, state: {} };
  }

  restore(_cursor: ControlFlowCursor): void {}
}

export class DelegationFlow implements ControlFlow {
  readonly type = 'delegation';

  constructor(
    private orchestrator: WorkflowUnit,
    private specialists: Map<string, WorkflowUnit>,
  ) {}

  private delegationQueue: string[] = [];
  private phase: 'orchestrating' | 'executing' | 'finalizing' = 'orchestrating';

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

  onOrchestratorOutput(output: AgentOutput): void {
    const delegations = (output.metadata.delegations as { targetUnitId: string }[]) ?? [];
    if (delegations.length > 0) {
      this.delegationQueue = delegations.map((d) => d.targetUnitId);
      this.phase = 'executing';
    }
  }

  isComplete(state: SharedState): boolean {
    return state.get('orchestrator.finalized') === true;
  }

  serialize(): ControlFlowCursor {
    return {
      flowType: this.type,
      state: { delegationQueue: this.delegationQueue, phase: this.phase },
    };
  }

  restore(cursor: ControlFlowCursor): void {
    this.delegationQueue = (cursor.state.delegationQueue as string[]) ?? [];
    this.phase = (cursor.state.phase as typeof this.phase) ?? 'orchestrating';
  }
}

export class CompositeFlow implements ControlFlow {
  readonly type = 'composite';

  constructor(private flows: ControlFlow[]) {}

  next(state: SharedState, completedUnits?: Set<UnitId>): WorkflowUnit[] {
    for (const flow of this.flows) {
      if (!flow.isComplete(state)) return flow.next(state, completedUnits);
    }
    return [];
  }

  isComplete(state: SharedState): boolean {
    return this.flows.every((f) => f.isComplete(state));
  }

  serialize(): ControlFlowCursor {
    return {
      flowType: this.type,
      state: { flows: this.flows.map((f) => f.serialize()) },
    };
  }

  restore(cursor: ControlFlowCursor): void {
    const flows = (cursor.state.flows as ControlFlowCursor[]) ?? [];
    flows.forEach((c, i) => this.flows[i]?.restore(c));
  }
}
