# SharedState

## What（是什么）

SharedState 是工作流运行期间的**共享键值存储**，供各 WorkflowUnit 通过 `inputAdapter` / `outputAdapter` 读写，供 ControlFlow（尤其 Router）读取路由与完成标记。

```typescript
interface SharedState {
  get<T>(key: string): T | undefined;
  set(key: string, value: unknown): void;
  snapshot(): Record<string, unknown>;
  // InMemory 实现支持 restore
}
```

常见键约定：`input.*` 初始输入、`output.<unitId>` 单元产出、`router.selectedKey` 路由结果、`hitl.*` 人工审批状态。

## Who（谁在用）

- 每个 Unit 的 adapter 作者
- RouterFlow / DAGFlow 等 ControlFlow 实现
- Checkpoint 恢复逻辑（序列化 snapshot）

## Why（为什么需要）

| 若没有 SharedState | 后果 |
|--------------------|------|
| Unit 之间传参靠全局变量 | 并发 Parallel 时数据竞争 |
| Router 无统一路由键 | 分支逻辑退回 Prompt |
| 无法快照恢复 | resume 后状态不一致 |

State 是 **Unit 间契约的载体**，不是数据库替代品——长期记忆走 [Layer4 Context](/architecture/modules/layer4)。

## How（怎么用）

**写入输出：**

```typescript
outputAdapter: (output, state) => {
  state.set('output.parser', output.content);
  state.set('router.selectedKey', output.metadata.routeKey);
},
```

**读取输入：**

```typescript
inputAdapter: (state, context) => ({
  task: state.get<string>('input.text') ?? '',
  prior: state.get('output.classifier'),
}),
```

**运行结果：** `WorkflowResult.state` 返回快照，HTTP 客户端查 `result.state['output.<unitId>']`。

## 仓库现状

| 项 | 状态 |
|----|------|
| InMemorySharedState | ✅ `src/core/shared-state.ts` |
| snapshot / restore | ✅ 配合 Checkpoint |
| 外部持久化 State | 🟡 通过 Checkpoint 间接恢复 |
| 强类型键表 | ⬜ 约定在文档与 YAML，非 Schema 强制 |

## 相关链接

- [WorkflowUnit](/architecture/modules/workflow-unit)
- [ControlFlow](/architecture/modules/control-flow)
- [执行管线](/architecture/pipeline)

## 若你只记住一件事

**Unit 之间只通过 State 对话；路由键写进 State，别写进隐藏全局。**
