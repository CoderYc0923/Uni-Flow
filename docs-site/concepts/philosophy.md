# 设计理念

## 我们要成为什么

| 对标 | 含义 |
|------|------|
| **像 MCP** | 业务项目 **依赖引擎** 跑起来，而不是只读一份文档规范 |
| **跨项目标准** | 垂直 Agent、通用问答、企业 RAG、AI 剪辑……共用编排语义 |
| **人 + AI 双友好** | 拓扑与预算可声明；领域逻辑插件化；配套 Schema / Rules |

## 双轨标准

```
uniflow.workflow.yaml  →  编排真源（拓扑 / policy / 路由）
         ↓
 @uni-flow engine      →  运行时
         ↓
  uses: plugins        →  领域 Unit（chatAgent、RecordExecutor…）
```

- **能声明的进配置**（顺序、路由、DAG、超时、Token 预算、HITL）
- **领域智能进插件**（Parse、SQL Tool、RAG、FFmpeg……）
- **禁止**各项目再发明第二套「手写 for 循环排班」与标准库并行

长文设计：[标准库 + YAML 双轨设计](https://github.com/OWNER/Uni-Flow/blob/main/docs/superpowers/specs/2026-07-14-uniflow-standard-library-yaml-design.md)（仓库内路径 `docs/superpowers/specs/...`）。

## 通俗类比

把 Uni-Flow 想成 **「工地总包」**，不是某一个工人：

| 角色 | 类比 |
|------|------|
| **WorkflowUnit** | 会干活的工人（Agent） |
| **ControlFlow** | 排班表：谁先干、谁并行、谁转线 |
| **SharedState / MessageBus** | 黑板与传话筒 |
| **Layer 4** | 安全帽、保险、打卡（记忆 / 重试 / 安全 / 快照） |

Uni-Flow **管「怎么编排很多 Agent」**，不替代某个大模型，也不吞掉你的业务规则。

## 设计原则

1. **ReAct 是原子引擎**：每个 Unit 内部默认是思考-行动-观察循环；Router/DAG 是 Unit 之上的组合
2. **控制流反转**：Unit 不感知自己处于何种 ControlFlow
3. **Runtime 黑盒边界**：编排层只认 `RuntimeAdapter`；箱内可用 LangChain / 自研 Kernel / HTTP
4. **横切非侵入**：Policy / Security / Context / Checkpoint 走统一执行管线
5. **渐进采纳**：Sidecar → Unit Wrapper → YAML 标准入口

## 采纳档位

| 档位 | 做法 | 适合 |
|------|------|------|
| **A Sidecar** | 只借 Memory/Checkpoint/观测 | 旧项目先试水 |
| **B Unit Wrapper** | 现有 Agent/Kernel 封成 Unit，外层 Uni-Flow 调度 | **推荐作为标准接入** |
| **C 全量编排** | 新建项目直接用 Engine + YAML | 绿场 |
