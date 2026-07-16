# 模式变动抗性

Agent 领域「主流模式」变得很快：去年 ReAct，今年 Plan-and-Execute，明天又可能出现新的推理范式。**好的编排基础设施应该让换模式主要动内层，而不是推倒重来。**

## 先纠正一个常见误读

> ❌ **误读：** Uni-Flow 的顶层架构是 Think → Execute → Observe 三阶段。

> ✅ **正解：** Think / Execute / Observe（ReAct 循环）发生在 **单个 WorkflowUnit 内部**，由 RuntimeAdapter 驱动。顶层是 **ControlFlow 决定下一个 Unit**，引擎再走 **Layer4 执行管线**。

```text
系统顶层（稳定）
  ControlFlow.next() → 选一个或多个 Unit
  Engine 管线 → Policy / Security / Context / Execute / …

Unit 内部（易变）
  Adapter.execute() → 可能是 ReAct、单次 LLM、LangGraph 子图、确定性函数
```

把 ReAct 画在顶层，会误以为「整个产品是一种推理模式」；实际上 **ReAct 只是 Unit 的一种默认实现方式**，与 Router、DAG 等宏观模式正交。

## 稳定层 vs 易变层

| 稳定层（换推理范式时尽量不动） | 易变层（随模型/范式演进） |
|-------------------------------|---------------------------|
| ControlFlow 接口（`next` / `isComplete`） | Unit 内 Prompt、工具列表 |
| WorkflowUnit 契约（id、adapters、termination） | RuntimeAdapter 具体实现 |
| SharedState / MessageBus 语义 | 选用哪家模型、是否多模态 |
| 引擎管线顺序与 Layer4 钩子 | 单个 Unit 内是否 ReAct、几步循环 |
| Workflow YAML Schema 与 `uniflow validate` | `uses` 插件里的领域逻辑 |
| Orchestrator HTTP 契约 | 图拓扑细节（DAG 边权、路由键名） |
| 远程 Unit HTTP 契约 | ControlFlow **组合方式**（业务变化时改 YAML） |

**注意：** ControlFlow 的**组合**（今天 Router，明天 Sequential+Parallel）属于「易变层」里的**配置**，但**机制**是稳定的——你改 YAML，不换引擎。

## 若 ReAct「过气」会怎样？

假设团队决定 Unit 内不再用 Thought-Action-Observation，改为一次性结构化输出：

| 影响范围 | 需要改什么 |
|----------|------------|
| Unit 内部 | 换 Adapter 实现或调 `terminationPolicy` |
| ControlFlow / YAML | **通常不变**——Router 仍根据 `output` 字段路由 |
| Layer4 | **通常不变**——Policy 仍统计 token，Security 仍拦工具 |
| 跨 Unit 契约 | 只要 `outputAdapter` 写入的 State 键保持稳定 |

反之，若把路由逻辑从 Router **塞进**某个 Unit 的 Prompt，则每次加支路都要改 Prompt 并重新测整段推理——**抗性差**。

## 模式映射：同一骨架，不同组合

设计长文附录中的统一公式：

```text
Agent 工作流 = AgentLoop ⊗ (Steering | FollowUp) ⊗ ControlFlow
```

| 主流「模式名」 | 在 Uni-Flow 中的表达 |
|----------------|----------------------|
| ReAct | 单 Unit + `LoopFlow` 或 Adapter 内循环 |
| Plan-and-Execute | DAG / Sequential 多 Unit |
| Multi-Agent 并行 | `ParallelFlow` |
| Router | `RouterFlow` + 多个 handler Unit |
| 主管委派 | `DelegationFlow` |
| 人机协同 | Security HITL + Checkpoint 暂停 |

**模式名会变，组合方式不变。** 新范式往往是「换一种 Unit 内部引擎 + 换一种 ControlFlow 组合」，而不是发明第四层架构。

## 契约优先：为何 YAML 与 validate 重要

稳定层要能抵抗人事与工具链变动：

1. **YAML 是拓扑真源** — diff 可读，AI 可改，CI 可 `validate`。
2. **插件边界清晰** — 新能力走 `uses`，不扩写引擎里的 `switch`。
3. **HTTP Unit** — 语言栈换了，只要契约不变，图不用重画。

见 [YAML 与 validate](/guide/yaml) 与 [跨语言](/guide/cross-lang)。

## 若你只记住一件事

**顶层是 ControlFlow + 管线，不是 ReAct 三件套；ReAct 关在 Unit 箱内。** 换推理 fashion 主要换 Adapter，不换编排基础设施。
