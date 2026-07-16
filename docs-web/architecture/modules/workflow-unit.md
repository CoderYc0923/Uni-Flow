# WorkflowUnit

## What（是什么）

WorkflowUnit 是 Uni-Flow 的**最小可调度原子**：一个带 `id` 的执行单元，负责从 SharedState 组装输入、调用 RuntimeAdapter、把输出写回 State，并声明何时终止。

```typescript
// 概念形状（详见 src/core/types.ts）
interface WorkflowUnit {
  id: string;
  runtime: RuntimeAdapter;
  terminationPolicy: TerminationPolicy;
  inputAdapter: (state, context?) => AgentInput;
  outputAdapter: (output, state) => void;
  tools?: Tool[];
  contextPolicy?: ContextPolicy;
  policyOverrides?: Partial<PolicyConfig>;
}
```

箱内可跑 ReAct 循环、单次 LLM、LangGraph 子图或确定性函数——**对外只暴露一次 `execute` 的边界**。

## Who（谁在用）

- 编写 `uses` 插件的开发者（把领域 Agent 封装成 Unit）
- 用代码 API `createWorkflowEngine` 构图的测试作者
- YAML 作者（通过 `spec.units` 声明单元，由 Loader 实例化）

## Why（为什么需要）

| 若没有 WorkflowUnit 边界 | 后果 |
|--------------------------|------|
| 编排层直接调模型 SDK | 换运行时必改 Engine |
| 输入输出无约定 | Router 无法根据稳定字段分支 |
| 终止条件散落 | Loop 与步数上限不可组合 |

Unit 把「一次可被调度的智能体执行」收口，使 ControlFlow 只需关心 **Unit id**，而不关心内部是 ReAct 还是工具链。

## How（怎么用）

**代码 API：**

```typescript
const unit: WorkflowUnit = {
  id: 'classifier',
  runtime: createMockAdapter({ /* ... */ }),
  terminationPolicy: { type: 'stop-reason', reasons: ['stop'] },
  inputAdapter: (state) => ({ task: state.get('input.text') }),
  outputAdapter: (output, state) => {
    state.set('output.classifier', output.content);
  },
};
```

**YAML：** 在 `spec.units` 中声明 `id`、`uses`、adapters 配置，由 [YAML Loader](/architecture/modules/yaml-loader) 解析。

**原则：**

- Unit **不应**内含「下一个跑哪个 Unit」的逻辑——那是 [ControlFlow](/architecture/modules/control-flow) 的职责。
- 路由结果写入 State 约定键（如 `router.selectedKey`），供 RouterFlow 读取。

## 仓库现状

| 项 | 状态 |
|----|------|
| 类型与 Engine 集成 | ✅ `src/core/types.ts`、`workflow-engine.ts` |
| Mock 演示 | ✅ `createMockAdapter` |
| 真实领域插件 | 🟡 业务方实现 `uses` |
| `artifacts` 元数据 | ⬜ 透传预留 |

## 相关链接

- [两层模型](/architecture/model)
- [RuntimeAdapter](/architecture/modules/runtime-adapter)
- [API：Adapters](/reference/adapters)

## 若你只记住一件事

**Unit 是箱；箱内随便换引擎，箱外只认 input/output 契约。**
