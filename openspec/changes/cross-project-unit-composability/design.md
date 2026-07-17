## Context

产品方确认：Uni-Flow 要支持「各项目用本语言 SDK 编排；跨项目把对方当标准 Unit 复用（对内完整 workflow，对外 Unit 契约）」。现有 `policyOverrides` / `contextPolicy` / `unit.config` 不够作为父级业务策略通道；`AgentInput` 与 Remote Unit 契约缺少 `params`；YAML 默认 adapter 只映射 `task`/`context`。

约束：YAML-first 拓扑不变；轻入侵（Engine 不解析领域语义）；本地与 HTTP 同一套输入模型。

长文设计稿：`docs/superpowers/specs/2026-07-17-cross-project-unit-composability-design.md`。

## Goals / Non-Goals

**Goals:**

1. `AgentInput.params` + state 映射 + HTTP 契约同步
2. Workflow-as-Unit 作为一等组合模式（主路径 `/execute`）
3. capability profile 文档约定（`$profile`）
4. 文档叙事改为跨项目复用为主

**Non-Goals:**

- Engine 内 typed RAG/客服 profile
- 父级节点级控制子 workflow
- 以 Orchestrator `runs` API 作为父 ControlFlow 默认 primitive
- 实现生产业务插件

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

## Risks / Trade-offs

- [松散 `params` 形状漂移] → Mitigation：`$profile` + 示例 profile 表；测试 golden fixtures
- [旧默认 adapter 不传 params] → Mitigation：本 change 必改 loader + 回归测试
- [文档仍写「跨语言」为主] → Mitigation：更新 uses 决策树与指南页
- [Wrapper 实现各异] → Mitigation：规格化 Wrapper 职责 + 最小 demo，不强制单一框架

## Migration Plan

1. 加可选字段与契约文档（向后兼容）
2. 改 YAML 默认 adapter；补测试
3. 更新 docs-web / README 口径；加 Workflow-as-Unit 示例
4. 无需数据迁移；旧 Unit 忽略 `params` 即可

## Open Questions

无阻塞项（brainstorming 已决策）。实现期可微调 demo 目录命名。
