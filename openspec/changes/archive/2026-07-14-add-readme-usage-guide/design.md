## Context

仓库已实现 Uni-Flow 生产级工作流框架（四层架构、Orchestrator HTTP/MCP、TS/Python/Java SDK），并有 `Agent统一工作流模式设计.md` 与 `openspec/specs/`。用户需要根 README 作为入口：从零安装到跑通案例，覆盖进程内与远程两种用法。现有 `examples/` 仅有代码审查与启动编排器草稿，README 尚不存在。

## Goals / Non-Goals

**Goals:**

- 用中文写清「是什么 / 怎么装 / 怎么跑 / 核心概念 / 完整案例」
- 在简介后立刻给出 **全链路解析流程图**，回答「Uni-Flow 在做什么、请求怎么走、每层如何协作」
- README 中的 TypeScript 示例必须可对照当前公开 API（`createWorkflowEngine`、`UniFlowClient`、`createOrchestratorServer` 等）
- 至少 3 个完整案例路径：① Sequential 进程内 ② Router 混合 ③ Orchestrator + SDK（含续跑/HITL 概要）
- 指向设计文档、openspec specs、Python/Java SDK 目录

**Non-Goals:**

- 不重写设计理论长文（设计细节链到现有文档）
- 不改造运行时代码 API
- 不把每个 ControlFlow 都写成独立教程章节（放速查表即可）
- 不强制要求 examples 全部可通过 `node` 直接执行（可 `vitest`/`ts` 加载）

## Decisions

| 决策 | 选择 | 理由 |
|------|------|------|
| 文档语言 | 中文为主，API/类型名保留英文 | 用户沟通语言；代码与生态标识保持准确 |
| 示例策略 | README 内嵌精简片段 + `examples/` 完整文件 | 扫读友好，同时可打开文件细读 |
| Runtime | 案例优先 `createMockAdapter` | 零外部 LLM Key 即可理解编排；另注如何换 `PiAgentAdapter` |
| 结构 | 渐进：简介 → **全链路图** → 安装 → 5 分钟上手 → 概念 → 案例 → API 速查 → 多语言 → FAQ | 先建立心智模型再动手 |
| 流程图格式 | GitHub 可渲染的 **Mermaid**（主）+ ASCII 兜底说明 | 多数 Markdown 预览可用；纯文本环境仍可理解 |

### 全链路图应覆盖的两条链路

**链路 1 — 系统全景（在做什么）**

```
业务方/ Cursor·Codex → SDK|REST|MCP → Orchestrator/Engine
  → ControlFlow 调度 → WorkflowUnit(RuntimeAdapter)
  → MessageBus + SharedState
  ↔ Layer4(Context / Policy / Security / Checkpoint / Observability)
  → WorkflowResult / 断点续跑 / HITL
```

**链路 2 — 单次 Unit 执行管线（怎么做）**

对应引擎实现顺序，必须与代码一致：

```
ControlFlow.next()
  → PolicyEngine.preCheck
  → SecurityGovernance.preHook
  → ContextManager.assemble
  → RuntimeAdapter.execute
  → SecurityGovernance.postHook
  → outputAdapter → SharedState
  → ContextManager.record
  → CheckpointStore.save
  → Observability.emit
  → MessageBus.publish
```

README 中用 1～2 个 Mermaid flowchart/sequenceDiagram 呈现上述两条链路，每张图下附 3～5 句「阶段说明」小标题（输入是什么、谁决策、产出是什么）。

### README 大纲（固定）

1. 项目简介与价值一句话  
2. **全链路解析流程图**（系统全景 + Unit 执行管线 + 阶段旁注）  
3. 四层架构对照表  
4. 环境要求与安装（`npm install` / `npm test` / `npm run build`）  
5. 快速开始（Sequential 迷你示例）  
6. 核心概念（WorkflowUnit / ControlFlow / Layer 4 / RuntimeAdapter / SDK 模式）  
7. 完整案例 A：Sequential 流水线  
8. 完整案例 B：Router 分流（链到 `examples/code-review-workflow.ts`）  
9. 完整案例 C：Orchestrator HTTP + `UniFlowClient`（含路由表）  
10. Layer 4 可选能力速查（Context / Checkpoint / Policy / Security）  
11. 多语言 Sidecar（Python LangGraph / Java LangChain4j）  
12. 常见问题与相关链接  

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| API 演进导致 README 过时 | 示例只使用 `src/index.ts` 稳定导出；任务中交叉校验 |
| 文档过长 | 案例放 essentials；细节链到设计文档与 specs |
| Mock 与真实 Agent 落差 | 单独小节说明替换 Adapter 步骤 |

## Migration Plan

1. 撰写 README.md  
2. 必要时整理 examples 注释与导出，使 README 链接有效  
3. 本地 `npm test` 确认现有测试仍通过（文档变更不破构建）

## Open Questions

- 无阻塞项；若用户希望 README 双语（中英），可作为后续 change
