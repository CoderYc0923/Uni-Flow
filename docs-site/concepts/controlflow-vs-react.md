# ControlFlow vs ReAct

```
一次用户请求
  └── ControlFlow（宏观：步骤怎么跳）
        └── 每个 WorkflowUnit ≈ ReAct / AgentLoop（微观）
```

| | ReAct（Unit 内） | ControlFlow（编排） |
|--|------------------|---------------------|
| 粒度 | 单 Agent 多轮 | 多 Unit / 多阶段 |
| 决策 | 模型决定工具 | 排班 / 路由规则决定下一 Unit |
| 典型场景 | 闲聊 + Tools | 记账路由、剪辑流水线、RAG 多段 |

## 大模型怎么接？

通常 **不是「只塞一个 URL」**，而是：

1. 提供可调用的 LLM/Agent 能力（HTTP、SDK、已有 Agent）
2. 包成 `RuntimeAdapter`（`execute` / `steer` / `followUp`）
3. 挂进 `WorkflowUnit` 或 YAML `uses:`

学习阶段可用 `createMockAdapter`，无需 API Key。

## 「黑盒」指什么？

对 **编排层** 而言 Unit 是黑盒（进任务、出结果）。  
对 **你** 而言可选白盒：订阅 Adapter 事件、或在 Unit 内继续用自研 Kernel——只是不要和 Uni-Flow 顶层调度抢方向盘。

## 与 LangGraph / 自研 Kernel

互补关系：外层标准化编排用 Uni-Flow；箱内可继续 LangChain/Kernel。推荐 **Unit Wrapper**，而不是推倒重来。
