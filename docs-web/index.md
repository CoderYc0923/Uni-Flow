---
layout: home
hero:
  name: Uni-Flow
  text: 跨项目统一编排标准库
  tagline: 每个项目用自己熟悉的语言写编排；需要复用时，把另一个项目当成标准 Unit 接入——而不是在每个仓库里重造一套排班循环。
  actions:
    - theme: brand
      text: 为什么选 Uni-Flow
      link: /why/three-w
    - theme: alt
      text: 快速开始
      link: /guide/quickstart
    - theme: alt
      text: 跨项目复用
      link: /guide/cross-project
    - theme: alt
      text: API 参考
      link: /reference/
features:
  - title: YAML 声明拓扑
    details: Router、Sequential、Parallel、DAG 等七种 ControlFlow 用 Workflow YAML 描述，人与 AI 共用同一份可校验契约。
  - title: Unit 与运行时解耦
    details: WorkflowUnit 通过 RuntimeAdapter 接入 LangGraph、Mastra Agent、HTTP 或 Mock；编排层不绑定具体模型与框架。
  - title: 统一执行管线
    details: Policy、Security、Context、Checkpoint、Observability 横切每个 Unit，避免把预算、鉴权、记忆复制进每个 Prompt。
  - title: 跨项目同一套契约
    details: 对内完整 workflow，对外标准 AgentInput / AgentOutput；HTTP Unit 是项目与部署边界，多语言 SDK 是各团队的接入方式。
---

## 从这里开始

| 你想… | 去读 |
|--------|------|
| 弄清该不该用（含 vs LangGraph / Mastra） | [诉求与 3W](/why/three-w) · [框架对比](/why/vs-frameworks) |
| 五分钟跑通本项目 Mock 工作流 | [快速开始](/guide/quickstart) |
| 把别的项目当成一个 Unit 接进来 | [跨项目复用](/guide/cross-project) |
| 查 HTTP / SDK / Engine API | [API 参考](/reference/) |

**若你只记住一件事：** Uni-Flow 管「多能力怎么编排、怎么跨项目复用」；模型与业务逻辑装进 `uses` 插件或 HTTP Unit。
