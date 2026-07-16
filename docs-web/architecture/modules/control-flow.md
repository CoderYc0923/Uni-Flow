# ControlFlow

## What（是什么）

ControlFlow 是**宏观编排策略**：在给定 SharedState 下决定下一步执行哪些 WorkflowUnit，并判断工作流是否完成。

```typescript
interface ControlFlow {
  readonly type: string;
  next(state: SharedState, completed?: Set<UnitId>): WorkflowUnit[];
  isComplete(state: SharedState): boolean;
  serialize(): ControlFlowCursor;
  restore(cursor: ControlFlowCursor): void;
}
```

## 七种流类型

| 类型 | 语义 | 典型场景 |
|------|------|----------|
| **Sequential** | 固定顺序 | 流水线：抽取 → 处理 → 回复 |
| **Parallel** | 并行互不依赖 | 多路校验同时执行 |
| **Router** | 条件分支 | 分类 Unit 产出路由键，选 handler |
| **DAG** | 依赖图 | Plan-and-Execute |
| **Loop** | 单 Unit 重复直到终止 | 箱内循环的外层包装 |
| **Delegation** | 主管委派专家 | 层级多 Agent |
| **Composite** | 嵌套子流 | 外层 Router，内层 Sequential |

YAML `flow.type` 映射到上述实现，见 `examples/templates/`。

## Who（谁在用）

- Workflow YAML 作者（声明拓扑）
- 用代码 API 构造复杂 Composite 的开发者
- 编码 Agent（在 Cursor 中改 `flow` 段并 `validate`）

## Why（为什么需要）

| 若没有 ControlFlow | 后果 |
|--------------------|------|
| 路由写在 Unit Prompt 里 | 加支路要重训 Prompt，难测 |
| 每项目手写状态机 | 语义分裂，无法共用 Schema |
| Unit 感知「自己是第几步」 | 控制流反转失败，复用度低 |

ControlFlow 回答 **「谁下一个」**；Unit 只回答 **「给定输入，产出什么」**。

## How（怎么用）

**YAML Router 示例（中性）：**

```yaml
flow:
  type: router
  entry: classifier
  routes:
    path-a: handler-a
    path-b: handler-b
```

分类 Unit 通过 `outputAdapter` 写入路由键；`RouterFlow` 在 `onRouterComplete` 中设置 `router.selectedKey`。

**代码 API：**

```typescript
import { SequentialFlow, RouterFlow } from 'uni-flow';

const flow = new SequentialFlow([unitA, unitB]);
```

复杂 Composite 在 YAML v1 表达受限时，可用 `createWorkflowEngine` 直接构图。

## 仓库现状

| 项 | 状态 |
|----|------|
| 七种 Flow 实现 | ✅ `src/core/control-flow/` |
| YAML 映射 | ✅ router / sequential / parallel 等 |
| Composite YAML | 🟡 复杂嵌套优先代码 API |
| Checkpoint 游标 | ✅ serialize / restore |

## 相关链接

- [两层模型](/architecture/model)
- [模式抗性](/why/resilience)
- [API：ControlFlow](/reference/controlflow)

## 若你只记住一件事

**先问业务怎么分支/排队，再选 ControlFlow；Unit 不应知道自己处在哪种 Flow。**
