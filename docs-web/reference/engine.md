# Engine API

进程内工作流执行核心：**`createWorkflowEngine`** → `WorkflowEngine`。

## createWorkflowEngine

```typescript
function createWorkflowEngine(
  config: WorkflowConfig,
  options?: WorkflowEngineOptions,
): WorkflowEngine
```

### WorkflowConfig

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `workflowId` | `string` | 是 | 工作流标识 |
| `units` | `Map<UnitId, WorkflowUnit>` | 是 | Unit 注册表 |
| `controlFlow` | `ControlFlow` | 是 | 控制流实例 |
| `sharedState` | `SharedState` | 否 | 默认内存 SharedState |
| `messageBus` | `MessageBus` | 否 | 默认内存 MessageBus |

### WorkflowEngineOptions

| 字段 | 类型 | 说明 |
|------|------|------|
| `contextManager` | `ContextManager` | 上下文 / 记忆组装 |
| `checkpointStore` | `CheckpointStore` | 检查点持久化 |
| `observability` | `Observability` | 追踪与指标 |
| `policyEngine` | `PolicyEngine` | 超时 / 预算 / 熔断 |
| `security` | `SecurityGovernance` | 权限与 HITL |
| `policyConfig` | `Partial<PolicyConfig>` | 策略配置覆盖 |
| `caller` | `{ id: string; roles: string[] }` | 调用方身份 |

## run

```typescript
async run(input?: Record<string, unknown>): Promise<WorkflowResult>
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `input` | `object` | 键值写入 SharedState 后启动执行循环 |

### WorkflowResult

| 字段 | 类型 | 说明 |
|------|------|------|
| `runId` | `string` | 运行 ID |
| `completedUnits` | `string[]` | 已完成 Unit |
| `state` | `Record<string, unknown>` | SharedState 快照 |
| `messages` | `WorkflowMessage[]` | 含 HITL 等消息 |
| `duration` | `number` | 毫秒 |
| `tokenUsage` | `number` | 累计 token |
| `cost` | `number` | 累计成本 |

## resume

```typescript
async resume(runId: string, snapshotId?: string): Promise<WorkflowResult>
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `runId` | `string` | 要恢复的运行 ID |
| `snapshotId` | `string` | 可选；指定检查点 |

从 CheckpointStore 加载快照，恢复 ControlFlow 游标与 SharedState，继续执行。

无检查点时抛出：`No checkpoint found for run: <runId>`

## 其他 WorkflowEngine 方法

| 方法 | 说明 |
|------|------|
| `steer(targetUnitId, content)` | 向运行中 Unit 注入 steering |
| `followUp(targetUnitId, content)` | 注入 follow-up |
| `respondToHITL(approved, responder)` | 响应 HITL 门控 |
| `getRunId()` | 当前 runId |
| `getSharedState()` | 访问 SharedState |

## 示例

```typescript
import { createWorkflowEngine, createSharedState, SequentialFlow } from 'uni-flow';

const engine = createWorkflowEngine({
  workflowId: 'demo',
  units,
  controlFlow: new SequentialFlow([unitA, unitB]),
  sharedState: createSharedState(),
});

const result = await engine.run({ task: 'hello' });
console.log(result.completedUnits, result.state);
```

## 相关

- [ControlFlow](/reference/controlflow)
- [Layer4](/reference/layer4)
- [YAML API](/reference/yaml-api)
- [生成附录说明](/reference/typedoc-appendix) · 查找 `createWorkflowEngine`：[附录正文](/reference/generated/)
