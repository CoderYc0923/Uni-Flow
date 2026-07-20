## Why

产品近期目标定为：**先把 TypeScript 做成完整 Uni-Flow**，并验证「一个 TS 项目可以把另一个 TS 项目当 Unit 嵌入」。现有 Engine/`params`/Workflow-as-Unit demo 已具备骨架，但安装与指南仍混杂多语言完整引擎预期，TS↔TS 项目互嵌的跟做路径不够像「两个独立 npm 项目」。远期 Python/Java Engine 移植不在本 change。

## What Changes

- 文档主叙事改为：**完整编排能力 = TypeScript**；TS 父项目 + TS 子项目（`/execute` + bindings）为跨项目一等示例
- 安装/快速开始：面向「在自有 TS 项目中依赖 `uni-flow`」写清 npm（或 path/Git 过渡），跑通进程内 YAML 与可选 Orchestrator
- 打磨 `examples/workflow-as-unit/`：更贴近「两项目」心智（目录/README/可选共享 Wrapper 助手）；指南逐步跟做
- 明确能力边界：Py/Java SDK 仅为客户端/Unit 边界，**不是**完整 Engine（避免误导）
- **非 BREAKING**；不移植 Engine；与进行中的 `docs-sdk-install-api-yaml-depth`（多语言包装/API 深度）解耦，本 change 优先落地

## Capabilities

### New Capabilities

- `docs-ts-complete-path`: TS 消费者项目完整接入（安装、进程内编排、与 Orchestrator 关系）
- `docs-ts-to-ts-unit`: TS↔TS Workflow-as-Unit 跟做指南与边界说明

### Modified Capabilities

- `workflow-as-unit`: demo/文档以 TS↔TS 为规范路径；Wrapper 职责可抽取为可复用助手（可选）
- `docs-cross-project-composability`: 跨项目页以 TS↔TS 为主例；多语言完整引擎标为远期

## Impact

- 文档：`docs-web/guide/install.md`、`quickstart`、`cross-project`、示例页；README/AGENTS 口径
- 示例：`examples/workflow-as-unit/` 结构与 README
- 可选代码：导出小型 `createWorkflowAsUnitHttpHandler`（或等价）减少子项目样板
- 不改 ControlFlow 语义；不做 Py/Java Engine；不强制完成本 change 外的 API 全量清单
