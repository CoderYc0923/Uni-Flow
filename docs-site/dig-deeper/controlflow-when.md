# ControlFlow 何时用

仍挂在记账故事上：什么时候该用哪种排班。

| ControlFlow | 设计理由 | 仓库现状 | 记账相关例子 |
|-------------|----------|----------|--------------|
| **Router** | 一句话多意图，只能走一条业务线 | ✅ YAML `flow.type: router` | 主故事：record / general |
| **Sequential** | 固定流水线（解析 → 落库 → 回复） | ✅ | 记账成功后「确认文案」多步 |
| **Parallel** | 互不依赖的检查同时做 | ✅ | 风控规则 + 汇率查询并行 |
| **DAG** | 有依赖的多步计划 | ✅ | Plan-and-Execute 式对账 |
| **Loop** | 自我反思直到达标 | ✅ | 金额解析不确定时重试 |
| **Delegation** | 主管委派专家 | ✅ | 复杂报销交给「票据专家」Unit |
| **Composite** | 嵌套组合 | ✅ 代码 API 更完整；YAML v1 有限 | 顶层 Router，某支路内 Sequential |

| 设计理由 | 仓库现状 |
|----------|----------|
| Unit 不感知自己处在哪种 Flow（控制流反转） | ✅ Engine 只认 `ControlFlow.next()` |

副例：代码审查混合流见 `examples/code-review-workflow.ts`（深挖用，不是入门主故事）。

## 若你只记住一件事

**先问「业务怎么分支/排队」，再选 ControlFlow；不要先选框架名词。**
