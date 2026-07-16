# Engine

## What（是什么）

Engine（`DefaultWorkflowEngine`）是编排**运行时心脏**：驱动 ControlFlow 循环，对每个选中的 WorkflowUnit 执行 Layer4 管线，维护 run 元数据，支持 pause / resume / HITL。

```typescript
interface WorkflowEngine {
  run(input?: Record<string, unknown>): Promise<WorkflowResult>;
  resume(runId: string, snapshotId?: string): Promise<WorkflowResult>;
  steer(targetUnitId: UnitId, content: string): void;
  followUp(targetUnitId: UnitId, content: string): void;
  respondToHITL(approved: boolean, responder: string): Promise<void>;
  getState(): SharedState;
  getRunId(): string;
}
```

## Who（谁在用）

- 应用内嵌：直接 `createWorkflowEngine` / `createEngineFromYaml`
- 服务端：由 [Orchestrator](/architecture/modules/orchestrator) 包装为 HTTP
- SDK：TS / Python / Java 通过 HTTP 或进程内 API 触发 run

## Why（为什么需要）

| 若没有统一 Engine | 后果 |
|-----------------|------|
| ControlFlow 与管线各写一套 | Policy/Security 顺序不一致 |
| 并行 Unit 异常处理分裂 | Parallel 失败语义不统一 |
| 无 runId / checkpoint | 运维无法追踪与恢复 |

Engine 把「宏观循环 + 微观管线 + 暂停恢复」收成**单一实现**，YAML 与代码 API 共用。

## How（怎么用）

**最小运行：**

```typescript
const engine = createWorkflowEngine({
  workflowId: 'demo',
  units,
  controlFlow: new SequentialFlow([unitA, unitB]),
  sharedState: createSharedState(),
});

const result = await engine.run({ 'input.text': 'hello' });
// result.completedUnits, result.state, result.messages
```

**从 YAML：**

```typescript
const engine = await createEngineFromYaml('workflow.yaml', { registry });
await engine.run();
```

管线顺序详见 [执行管线与 Layer4](/architecture/pipeline)。

## 仓库现状

| 项 | 状态 |
|----|------|
| DefaultWorkflowEngine | ✅ `src/core/workflow-engine.ts` |
| Parallel 错误语义 | ✅ `ParallelFlow.markFailed` |
| Router 回调 | ✅ `onRouterComplete` |
| HITL 暂停 | ✅ 与 Security / Checkpoint 联动 |
| 分布式 Engine 集群 | 🟡 单进程为主；水平扩展靠 Orchestrator 多实例 |

## 相关链接

- [两层模型](/architecture/model)
- [执行管线](/architecture/pipeline)
- [API：Engine](/reference/engine)

## 若你只记住一件事

**Engine 只干两件事：按 ControlFlow 选人，按固定管线跑 Unit。**
