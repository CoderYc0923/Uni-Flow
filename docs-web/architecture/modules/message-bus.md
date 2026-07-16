# MessageBus

## What（是什么）

MessageBus 是工作流内的**事件发布订阅通道**，记录 steering、followUp、unit 输出、checkpoint、HITL、成本更新等消息，供引擎、UI 与集成方消费。

```typescript
// 概念：异步 publish + 可选 publishSync；history() 供结果带出
messageBus.publish({ type: 'unit-output', sourceUnitId, data, timestamp });
```

与 SharedState 分工：**State 存当前快照，Bus 存事件流**。

## Who（谁在用）

- Engine（执行单元后发布事件）
- 需要订阅 HITL / 流式更新的前端或运维系统
- `WorkflowResult.messages` 的调用方

## Why（为什么需要）

| 若没有 MessageBus | 后果 |
|-----------------|------|
| 仅轮询 State | 难以感知「何时产生 HITL 请求」 |
| steer 不可观测 | 调试运行时注入困难 |
| 无历史 | 审计与回放缺少时序记录 |

Bus 让横切事件**可集成**，而不污染 Unit 业务逻辑。

## How（怎么用）

**引擎内自动发布：** `unit-output`、`checkpoint`、`hitl-request`、`cost-update` 等由 `DefaultWorkflowEngine` 触发。

**运行时注入：**

```typescript
engine.steer('target-unit-id', '用户补充说明');
engine.followUp('target-unit-id', '追加问题');
```

对应消息写入 Bus，并调用目标 Unit 的 `runtime.steer` / `followUp`。

**读取：**

```typescript
const result = await engine.run(input);
console.log(result.messages); // 或 engine.getMessages()
```

## 仓库现状

| 项 | 状态 |
|----|------|
| 内存 Bus | ✅ `src/core/message-bus.ts` |
| Checkpoint 含 history | ✅ 恢复时可带回 |
| 外部队列桥接 | 🟡 需自行订阅 HTTP/Webhook |
| 持久化 Bus | 🟡 依赖 Checkpoint 快照 |

## 相关链接

- [Engine](/architecture/modules/engine)
- [Layer4 HITL](/architecture/pipeline)
- [Orchestrator HTTP](/architecture/modules/orchestrator)

## 若你只记住一件事

**State 是「现在是什么」；Bus 是「发生了什么」。**
