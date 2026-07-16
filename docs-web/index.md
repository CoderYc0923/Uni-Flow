---
layout: home
hero:
  name: Uni-Flow
  text: Agent 统一编排标准库
  tagline: 为需要稳定调度多个 Agent 的团队——把拓扑写进 YAML，把领域智能做成可插拔 Unit，而不是在每个项目里重造一套排班循环。
  actions:
    - theme: brand
      text: 为什么选 Uni-Flow
      link: /why/three-w
    - theme: alt
      text: 两层模型
      link: /architecture/model
    - theme: alt
      text: 快速开始
      link: /guide/quickstart
    - theme: alt
      text: API 参考
      link: /reference/
features:
  - title: YAML 声明拓扑
    details: Router、Sequential、Parallel、DAG 等七种 ControlFlow 用 Workflow YAML 描述，人与 AI 共用同一份可校验契约。
  - title: Unit 与运行时解耦
    details: WorkflowUnit 通过 RuntimeAdapter 接入 LangGraph、pi-agent-core 或 Mock；编排层不绑定具体模型与框架。
  - title: 统一执行管线
    details: Policy、Security、Context、Checkpoint、Observability 横切每个 Unit，避免把预算、鉴权、记忆复制进每个 Prompt。
  - title: 跨语言同一套图
    details: Orchestrator HTTP + 远程 Unit 契约，让 Python/Java 团队与 TypeScript 核共享同一份 YAML 拓扑。
---

## 从这里开始

| 你想… | 去读 |
|--------|------|
| 弄清产品为谁、为何、怎么上手 | [诉求与 3W](/why/three-w) |
| 理解外层 ControlFlow + 内层 Unit 的两层模型 | [两层模型](/architecture/model) |
| 五分钟跑通 Mock 工作流 | [快速开始](/guide/quickstart) |
| 查 HTTP 路由、SDK 与引擎 API | [API 参考](/reference/) |

**若你只记住一件事：** Uni-Flow 管「多 Agent 怎么编排」；不管你选哪个大模型、怎么写业务逻辑——后者装进 `uses` 插件或 HTTP Unit。
