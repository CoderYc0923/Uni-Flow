## Context

产品方确认：Uni-Flow 要支持「各项目用本语言 SDK 编排；跨项目把对方当标准 Unit 复用（对内完整 workflow，对外 Unit 契约）」。现有 `policyOverrides` / `contextPolicy` / `unit.config` 不够作为父级业务策略通道；`AgentInput` 与 Remote Unit 契约缺少 `params`；YAML 默认 adapter 只映射 `task`/`context`。

约束：YAML-first 拓扑不变；轻入侵（Engine 不解析领域语义）；本地与 HTTP 同一套输入模型。

长文设计稿：`docs/superpowers/specs/2026-07-17-cross-project-unit-composability-design.md`。

## Goals / Non-Goals

**Goals:**

1. `AgentInput.params` + state 映射 + HTTP 契约同步
2. Workflow-as-Unit 作为一等组合模式（主路径 `/execute`）
3. capability profile 文档约定（`$profile`）
4. VitePress **档位 1**：使用者旅程 IA + 关键页重写（含 vs Mastra）；跨项目复用为主叙事

**Non-Goals:**

- Engine 内 typed RAG/客服 profile
- 父级节点级控制子 workflow
- 以 Orchestrator `runs` API 作为父 ControlFlow 默认 primitive
- 实现生产业务插件
- 全站逐页通读改版（模块 3W / HTTP 逐路由正文大段重写留给后续）
- 照搬 Mastra 的 Agents/Memory/Studio 产品结构或视觉

## Decisions

### D1: 业务策略走 `AgentInput.params`，不新增 YAML 第四通道

- **选择：** 可选 `params?: Record<string, unknown>`；`unit.config` 仅静态默认；合并优先级 `params > config > 内部默认`
- **替代：** 仅用 `unit.config`（静态、远程难传运行时差异）；新 YAML `capabilityPolicy`（重复控制面）；塞进 `context` 字符串（长期混乱）
- **理由：** 与 Unit 边界一致，本地/远程同一信封，Engine 只透传

### D2: typed profile 在文档 / Wrapper，不进核心类型

- **选择：** `params.$profile`（如 `rag.v1`）由文档与 Wrapper 解释；未知字段忽略
- **替代：** Engine 内 discriminated union（污染 core、跨语言帮助有限）
- **理由：** 轻入侵、多语言友好

### D3: 跨项目组合主路径是 Unit `/execute`，workflow-run 为旁路

- **选择：** Workflow-as-Unit Wrapper 对外暴露 Unit 契约；Orchestrator `POST /workflows/:id/runs` 保留作独立触发
- **替代：** 父 YAML 默认 `uses` 调远端整个 Orchestrator run（生命周期/超时语义重）
- **理由：** 贴合「对父级只是 Unit」；与现有 HttpAdapter 对齐

### D4: 控制平面四通道分工

| 通道 | 职责 |
|------|------|
| ControlFlow/YAML | 拓扑 |
| `policyOverrides` | 运维策略 |
| `contextPolicy` | Layer4 上下文装配 |
| `params` | 业务策略 |

`params` MUST NOT 承载 secrets。

### D5: 默认 state 键

- `task` → `task`
- `context` → `context`
- `input.params` 或 run input 的 `params` → `params`
- YAML `wrapAdapter` MUST 映射上述字段

### D6: 输出可编程消费

- 继续透传 `AgentOutput.metadata`；profile 文档约定稳定键（如 `route`、`citations`）
- Engine 不解析领域 metadata

### D7: VitePress 档位 1（使用者旅程，参考 Mastra 写法）

借鉴 [Mastra](https://mastra.ai/) / [Mastra Docs](https://mastra.ai/docs)：**先 Get started、少 CTA、按「你要干什么」分路径**；不抄其「一体式 TS Agent 框架」IA。

**Uni-Flow vs Mastra（文档必须讲清）：**

| | Mastra | Uni-Flow |
|--|--------|----------|
| 主战场 | 单语言（TS）应用内造 Agent/Workflow | 跨项目复用同一编排规范 |
| 编排 | 代码优先 `.then`/`.branch`/`.parallel` | YAML + ControlFlow + validate |
| 运行时 | 自带 Agent/模型/工具 | Unit 边界；箱内可挂任意运行时 |
| 关系 | 互补：Mastra Agent 可进一个 Unit | 不替代 Mastra |

**使用者旅程导航：**

```text
该不该用 → Why（3W / vs LangGraph·Mastra / 抗性）
单项目跑通 → 安装 → 快速开始 → YAML
接别的项目 → 跨项目复用（新主指南；params / Workflow-as-Unit）
例子 → 示例（单项目 / 跨项目）
查 API → Reference
挖原理 → 原理（后置）
```

**本 change 必改页：** 首页、`why/three-w`、`why/vs-frameworks`（加 Mastra）、`guide/uses`、新建 `guide/cross-project`（含 profile 模板）、`guide/cross-lang` 导语降级、示例索引、README/AGENTS、`.vitepress/config` nav/sidebar。

**不改：** 全部 HTTP 路由手册与模块 3W 全文（仅允许首页/指南交叉链接微调）。

## Risks / Trade-offs

- [松散 `params` 形状漂移] → Mitigation：`$profile` + 示例 profile 表；测试 golden fixtures
- [旧默认 adapter 不传 params] → Mitigation：本 change 必改 loader + 回归测试
- [文档仍写「跨语言」为主] → Mitigation：档位 1 IA + 关键页重写
- [Wrapper 实现各异] → Mitigation：规格化 Wrapper 职责 + 最小 demo，不强制单一框架
- [读者把 Uni-Flow 当成「另一个 Mastra」] → Mitigation：vs 页写清互补与边界

## Migration Plan

1. 加可选字段与契约文档（向后兼容）
2. 改 YAML 默认 adapter；补测试
3. VitePress 档位 1 + README；加 Workflow-as-Unit 示例
4. 无需数据迁移；旧 Unit 忽略 `params` 即可

## Open Questions

无阻塞项（档位 1 已确认）。实现期可微调 demo 目录命名与 nav 文案。
