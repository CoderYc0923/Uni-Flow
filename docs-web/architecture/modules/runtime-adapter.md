# RuntimeAdapter

## What（是什么）

RuntimeAdapter 是 WorkflowUnit 与**具体 Agent 运行时**之间的桥梁。引擎只调用统一接口：

```typescript
interface RuntimeAdapter {
  execute(input: AgentInput, ctx: ExecuteContext): Promise<AgentOutput>;
  steer?(content: string): void;
  followUp?(content: string): void;
  frameworkInfo(): { name: string; version?: string };
}
```

实现方可以是 pi-agent-core、LangGraph 包装器、HTTP 代理、或确定性 Mock。

## Who（谁在用）

- 集成现有 Agent 框架的开发者
- 需要无 API Key 跑通拓扑的 CI / 文档读者（Mock）
- 跨语言团队（远程 HTTP Unit 在 Orchestrator 侧绑定，仍走 Adapter 契约）

## Why（为什么需要）

| 若没有 Adapter 层 | 后果 |
|-------------------|------|
| Engine 绑死单一 SDK | 无法「外层 Uni-Flow + 内层 LangGraph」 |
| 测试必须调真模型 | 拓扑测试昂贵、不稳定 |
| steer/followUp 各写一套 | 运行时消息无法经 MessageBus 统一观测 |

Adapter 让 **编排基础设施** 与 **模型/图运行时** 解耦，是 [与框架对比](/why/vs-frameworks) 中「Unit Wrapper」的落点。

## How（怎么用）

**Mock（零依赖）：**

```typescript
import { createMockAdapter } from 'uni-flow';

const runtime = createMockAdapter({
  responseFn: (input) => ({
    content: `echo: ${input.task}`,
    toolCalls: [],
    stopReason: 'stop',
    metadata: {},
  }),
});
```

**包装 LangGraph（思路）：** 在 `execute` 内 `graph.invoke(state)`，映射 `AgentInput` ↔ 图状态，返回 `AgentOutput`。

**远程 Unit：** Orchestrator `bindings` 将 `uses` 解析为 HTTP Adapter，请求体遵循 `docs/remote-unit-http-contract.md`。

## 仓库现状

| 项 | 状态 |
|----|------|
| 接口定义 | ✅ `src/core/types.ts` |
| Mock Adapter | ✅ |
| pi-agent-core 适配 | ✅ 仓库内示例与测试 |
| 任意框架样板 | 🟡 需业务方按 Wrapper 模式扩展 |
| HTTP 远程 Adapter | ✅ Orchestrator bindings |

## 相关链接

- [WorkflowUnit](/architecture/modules/workflow-unit)
- [跨语言指南](/guide/cross-lang)
- [API：Adapters](/reference/adapters)

## 若你只记住一件事

**换模型/换框架，改 Adapter；别改 ControlFlow。**
