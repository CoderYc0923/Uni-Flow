# 核心公式

三个词，对应记账故事里的三个角色。

## 1. WorkflowUnit（干活的工人）

一个可调度单元：输入从 SharedState 来，输出写回 State；内部通常是一次 Agent/Adapter 执行（可 ReAct 循环）。

| 设计理由 | 仓库现状 |
|----------|----------|
| 记账 Unit 与闲聊 Unit 互不感知对方，只认自己的输入输出 | ✅ `WorkflowUnit` + `RuntimeAdapter`（含 `createMockAdapter`） |

**在记账里：** `record` / `general` / `router` 各是一个 Unit。

## 2. ControlFlow（排班表）

决定「下一个跑谁」：顺序、并行、路由、DAG……

| 设计理由 | 仓库现状 |
|----------|----------|
| 意图分流是 **Router**，不是把路由写进某个 Unit 内部 for 循环 | ✅ `RouterFlow` / `SequentialFlow` 等七种；YAML `flow.type: router` |

**在记账里：** `flow.type: router`，`routes.record → record`。

## 3. 引擎管线（每次干活前后的安检）

每个 Unit 真正执行前，会按固定顺序走横切：

**Policy → Security → Context → Execute → 回写 → Checkpoint → 观测 → Bus**

| 设计理由 | 仓库现状 |
|----------|----------|
| 预算、鉴权、记忆、快照不应散落在每个 Agent 里复制粘贴 | ✅ `DefaultWorkflowEngine` 管线；Layer4 可插拔（部分要显式接入） |

**在记账里：** 可给整条工作流设 Token 预算；HITL/安全按需挂上。

## 和「箱内 ReAct」的关系

```text
一次请求
  └── ControlFlow（宏观：谁下一步）
        └── 每个 Unit ≈ 箱内 ReAct / Adapter.execute（微观）
```

Unit **不需要知道**自己处在 Router 还是 Sequential——这叫控制流反转。

## 若你只记住一件事

**YAML 画排班；插件干领域活；引擎按同一管线执行。**

下一页：[是不是空壳？](empty-shell.md)
