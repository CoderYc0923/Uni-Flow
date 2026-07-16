# ControlFlow

ControlFlow 决定 **哪些 Unit 在何时执行**。YAML `spec.flow` 映射到下列类（Composite 仅代码 API）。

## 类总览

| 类 | `type` | YAML 支持 | 说明 |
|----|--------|-----------|------|
| `SequentialFlow` | `sequential` | ✅ | 按顺序逐个执行 |
| `ParallelFlow` | `parallel` | ✅ | 并行执行后由 reducer 汇总 |
| `RouterFlow` | `router` | ✅ | 路由 Unit 决定分支 |
| `LoopFlow` | `loop` | ✅ | 单 Unit 迭代直至条件或上限 |
| `DAGFlow` | `dag` | ✅ | 规划 → 依赖图执行 → 聚合 |
| `DelegationFlow` | `delegation` | ✅ | 编排者委派专家 Unit |
| `CompositeFlow` | `composite` | ❌ | 嵌套子 ControlFlow（仅代码） |

## SequentialFlow

```typescript
new SequentialFlow(units: WorkflowUnit[])
```

| YAML 字段 | 说明 |
|-----------|------|
| `type: sequential` | — |
| `order: string[]` | Unit ID 顺序；省略则按 `units` 声明顺序 |

## ParallelFlow

```typescript
new ParallelFlow(
  units: WorkflowUnit[],
  reducer: WorkflowUnit,
  failureStrategy?: FailureStrategy, // 默认 'fail-fast'
)
```

| YAML 字段 | 说明 |
|-----------|------|
| `units: string[]` | 并行 Unit ID 列表 |
| `reducer: string` | 汇总 Unit ID |
| `failureStrategy` | `'fail-fast' \| 'continue'` |

## RouterFlow

```typescript
new RouterFlow(
  router: WorkflowUnit,
  handlers: Map<string, WorkflowUnit>,
  routeExtractor: (output: AgentOutput) => string,
)
```

| YAML 字段 | 说明 |
|-----------|------|
| `routerUnit: string` | 路由 Unit |
| `routes: Record<string, string>` | 路由键 → 目标 Unit ID |

默认 `routeExtractor`：优先 `output.metadata.route`，否则 `output.content.trim()`。

示例：[记账意图分流](/examples/accounting-router)

## LoopFlow

```typescript
new LoopFlow(
  unit: WorkflowUnit,
  maxIterations: number,
  terminationCondition?: (state: SharedState) => boolean,
)
```

| YAML 字段 | 说明 |
|-----------|------|
| `unit: string` | 循环体 Unit |
| `maxIterations` | 上限，默认 `10` |
| `untilStateKey` | SharedState 键为真时终止 |

## DAGFlow

```typescript
new DAGFlow(
  planner: WorkflowUnit,
  executors: Map<string, WorkflowUnit>,
  aggregator: WorkflowUnit,
  dependencies: Map<string, string[]>,
)
```

| YAML 字段 | 说明 |
|-----------|------|
| `planner` | 生成计划的 Unit |
| `executors: string[]` | 执行步骤 Unit |
| `aggregator` | 聚合 Unit |
| `dependencies` | 步骤依赖图 |

## DelegationFlow

```typescript
new DelegationFlow(
  orchestrator: WorkflowUnit,
  specialists: Map<string, WorkflowUnit>,
)
```

| YAML 字段 | 说明 |
|-----------|------|
| `orchestrator` | 委派决策 Unit |
| `specialists: string[]` | 专家 Unit 列表 |

## CompositeFlow

```typescript
new CompositeFlow(subFlows: ControlFlow[])
```

YAML v1 **不支持**。复杂嵌套拓扑请在 TS 中用 `createWorkflowEngine` 构建子图。

## ControlFlow 接口

所有实现均提供：

| 方法 | 说明 |
|------|------|
| `next(state, completedUnits?)` | 返回下一批待执行 Unit |
| `isComplete(state)` | 控制流是否结束 |
| `serialize()` | 检查点游标 |
| `restore(cursor)` | 从检查点恢复 |

## 相关

- [Engine](/reference/engine)
- [YAML API](/reference/yaml-api)
