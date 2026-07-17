# Cross-Project Unit Composability 设计

日期：2026-07-17  
状态：已与产品方确认（brainstorming）；OpenSpec change：`cross-project-unit-composability`

## 1. Context

Uni-Flow 的目标是在不同项目中复用同一套编排规范（RAG、多 Agent、单 Agent 等），而不是鼓励「同一工作流里混用多种语言的子 Agent」。

已确认诉求：

- 各项目用本语言 SDK（TS / Python / Java）写编排
- 项目内部可以是完整 workflow
- 跨项目复用时，把对方暴露成标准 Unit（输入/输出契约）
- 例：客服（Python/Java）把 RAG（TS）项目当作一个 Unit 调用

当前缺口：

- 叙事偏「跨语言」，主价值「跨项目复用」不够突出
- `AgentInput` 缺少父级向子 capability 传递业务策略的标准通道
- Remote Unit HTTP 契约未覆盖该通道
- YAML 默认 `inputAdapter` 只映射 `task` / `context`
- 缺少 Workflow-as-Unit Wrapper 的一等模式说明

## 2. Goals / Non-Goals

**Goals**

1. 明确产品定位：**跨项目复用同一编排规范**；多语言 SDK 与 HTTP 为手段
2. 标准化 `AgentInput.params` 作为父级对子 Unit 的业务策略主通道
3. 同步 Remote Unit HTTP 契约与默认 state → input 映射
4. 定义 Workflow-as-Unit Wrapper：对内完整 workflow，对外 Unit `/execute`
5. 约定 capability profile（文档层）与 `AgentOutput.metadata` 可编程消费
6. VitePress **档位 1**：按使用者旅程重梳 IA 与关键页；对比纳入 Mastra；跨语言降为手段

**Non-Goals**

- 不在 Engine 内解析 RAG/客服等领域 `params` 语义
- 不让父级节点级控制子 workflow 内部拓扑 / prompt
- 不以 Orchestrator workflow-run API 作为父 ControlFlow 的默认组合 primitive
- 不实现生产级 RAG/客服业务插件本身
- 不新增第四条 YAML 顶层控制语义（如 `capabilityPolicy`）
- 不做全站逐页通读改版；不照搬 Mastra 的 Agents/Memory/Studio 结构

## 3. Product positioning

> Uni-Flow 让不同语言的项目都能采用同一套工作流编排规范；当一个项目需要复用另一个项目能力时，可将后者作为标准 Unit 接入，而不是要求两边同语言或同代码库。

| 能力 | 定位 |
|------|------|
| 同语言进程内 SDK + YAML | 单项目编排主路径 |
| HTTP Remote Unit | 跨项目 / 跨部署能力边界 |
| 多语言 SDK | 各团队用本语言接入同一规范 |
| Orchestrator workflow API | 独立触发完整 workflow（旁路，非父图组合主路径） |

## 4. Control plane（四条通道）

```text
父级编排层
  ├─ ControlFlow / YAML        → 拓扑（跑谁、顺序、分支）
  ├─ policyOverrides           → 超时、重试、预算、熔断
  ├─ contextPolicy             → Layer4 上下文/记忆装配
  └─ AgentInput.params         → 对子 capability 的业务策略（主通道）
        ↑
子 Unit（本地或远程）
  ├─ unit.config               → 静态默认值 / 插件装配
  └─ 内部 workflow             → 完全自治
```

**优先级：** `运行时 input.params` > `unit.config` 默认值 > 子服务内部默认。

**禁止：** `params` 承载 secrets；密钥走 bindings headers / `ExecutionContext.secrets`。

## 5. AgentInput.params

### 5.1 核心类型（Engine 只透传）

```typescript
interface AgentInput {
  task: string;
  context?: string;
  params?: Record<string, unknown>;
  delegatedBy?: UnitId;
}
```

### 5.2 Capability profile（文档 / Wrapper，不进 Engine 类型系统）

```json
{
  "task": "用户问：退款多久到账？",
  "params": {
    "$profile": "rag.v1",
    "retrievalMode": "fast",
    "topK": 5,
    "domain": "after-sales"
  }
}
```

- Engine **不校验** `$profile` 或领域字段
- Wrapper / 插件 MAY 校验；未知字段 SHOULD 忽略
- 版本用 `capability.vN` 演进；破坏性变更升 major

### 5.3 State → input 映射

约定 SharedState 键：

| State 键 | AgentInput 字段 |
|----------|-----------------|
| `task` | `task` |
| `context` | `context` |
| `input.params`（或 run input 的 `params`） | `params` |

YAML 默认 `inputAdapter` 必须映射上述字段，使进程内与远程路径一致。

## 6. Workflow-as-Unit Wrapper

```text
父 workflow
  └─ unit (uses → HTTP 或本地 wrapper)
       └─ POST /execute  { input: { task, params, ... }, context: ... }
            └─ Wrapper：params → 内部 workflow initial state
            └─ 跑完整子 workflow
            └─ 压缩为 AgentOutput { content, metadata, tokenUsage, ... }
```

- **主组合路径：** Unit 级 `/execute`
- **旁路：** Orchestrator `POST /workflows/:id/runs`（独立调试 / 批处理）
- 父级超时/重试仍由父级 `policyOverrides` 管外层；子内部策略自治

## 7. AgentOutput.metadata

父级应能编程消费稳定键，例如：

- `route`（已有约定，供 Router）
- capability 相关：`citations`、`confidence` 等（由 profile 文档定义）

Engine 对 `metadata` **透传**；不实现媒体管线（与现有 `artifacts` 预留一致）。

## 8. VitePress 档位 1 + vs Mastra

借鉴 [Mastra](https://mastra.ai/) 文档习惯：先上手、按任务分路径、少而清的 CTA。  
**定位对照：** Mastra = TS 应用内造 Agent/Workflow；Uni-Flow = 跨项目同一编排契约。互补，不替代（Mastra Agent 可进 Unit）。

使用者旅程：Why → 单项目跑通 → **跨项目复用** → 示例 → API → 原理（后置）。

必改：首页、3W、vs-frameworks（+Mastra）、uses、新建 cross-project、cross-lang 降级、示例索引、nav、README/AGENTS。  
不改：全部模块 3W / HTTP 路由手册全文。

## 9. Implementation surface（摘要）

| 区域 | 变更 |
|------|------|
| `src/core/types.ts` | `AgentInput.params?` |
| `docs/remote-unit-http-contract.md` | request `input.params` |
| `src/yaml/loader.ts` | 默认 adapter 映射 `params` |
| `HttpAdapter` | 已整包透传 `input`；补测试 |
| SDK（TS/Py/Java） | 文档与类型对齐；透传即可 |
| `docs-web/` | 档位 1 IA + 关键页；cross-project；vs Mastra |
| Demo | Workflow-as-Unit 最小示例（可基于 cross-lang greeter 扩展） |

## 10. Risks / Open points（已决策）

| 问题 | 决策 |
|------|------|
| typed profile？ | 文档 + Wrapper；核心保持 `Record` |
| 远程 workflow 级调用？ | API 保留；父图组合主路径用 Unit `/execute` |
| 新加 YAML 第四通道？ | 否 |
| 文档改版范围？ | 档位 1（IA + 关键页），非全站 |

## 11. Success criteria

1. 父项目可通过 `params`（含 `$profile`）调用子 Unit，本地与 HTTP 行为一致
2. 文档明确「跨项目复用」主叙事；cross-lang 降为手段；vs Mastra 可读
3. 有可跑的 Workflow-as-Unit 示例
4. `npm test` / `docs:build` 不回归
