import {
  DAGFlow,
  DelegationFlow,
  LoopFlow,
  ParallelFlow,
  RouterFlow,
  SequentialFlow,
} from '../core/control-flow/index.js';
import type { ControlFlow, WorkflowUnit } from '../core/types.js';
import { YamlLoadError } from './errors.js';
import type { YamlFlow } from './types.js';

function requireUnit(units: Map<string, WorkflowUnit>, id: string, context: string): WorkflowUnit {
  const unit = units.get(id);
  if (!unit) {
    throw new YamlLoadError(`${context}: unknown unit id "${id}"`);
  }
  return unit;
}

export function buildControlFlow(flow: YamlFlow, units: Map<string, WorkflowUnit>): ControlFlow {
  switch (flow.type) {
    case 'sequential': {
      const order = flow.order ?? [...units.keys()];
      return new SequentialFlow(order.map((id) => requireUnit(units, id, 'sequential.order')));
    }
    case 'parallel': {
      const parallelUnits = flow.units.map((id) => requireUnit(units, id, 'parallel.units'));
      const reducer = requireUnit(units, flow.reducer, 'parallel.reducer');
      return new ParallelFlow(parallelUnits, reducer, flow.failureStrategy ?? 'fail-fast');
    }
    case 'router': {
      const router = requireUnit(units, flow.routerUnit, 'router.routerUnit');
      const handlers = new Map<string, WorkflowUnit>();
      for (const [key, unitId] of Object.entries(flow.routes)) {
        handlers.set(key, requireUnit(units, unitId, `router.routes.${key}`));
      }
      return new RouterFlow(router, handlers, (output) => {
        const fromMeta = output.metadata?.route;
        if (typeof fromMeta === 'string' && fromMeta.length > 0) return fromMeta;
        return output.content.trim();
      });
    }
    case 'loop': {
      const unit = requireUnit(units, flow.unit, 'loop.unit');
      const max = flow.maxIterations ?? 10;
      const untilKey = flow.untilStateKey;
      return new LoopFlow(
        unit,
        max,
        untilKey ? (state) => Boolean(state.get(untilKey)) : undefined,
      );
    }
    case 'dag': {
      const planner = requireUnit(units, flow.planner, 'dag.planner');
      const aggregator = requireUnit(units, flow.aggregator, 'dag.aggregator');
      const executors = new Map<string, WorkflowUnit>();
      for (const id of flow.executors) {
        executors.set(id, requireUnit(units, id, 'dag.executors'));
      }
      const dependencies = new Map<string, string[]>();
      for (const [step, deps] of Object.entries(flow.dependencies ?? {})) {
        dependencies.set(step, deps);
      }
      return new DAGFlow(planner, executors, aggregator, dependencies);
    }
    case 'delegation': {
      const orchestrator = requireUnit(units, flow.orchestrator, 'delegation.orchestrator');
      const specialists = new Map<string, WorkflowUnit>();
      for (const id of flow.specialists) {
        specialists.set(id, requireUnit(units, id, 'delegation.specialists'));
      }
      return new DelegationFlow(orchestrator, specialists);
    }
    default: {
      const exhaustive: never = flow;
      throw new YamlLoadError(`Unsupported flow type: ${(exhaustive as YamlFlow).type}`);
    }
  }
}
