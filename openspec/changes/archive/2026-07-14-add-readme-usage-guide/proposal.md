## Why

Uni-Flow 已具备完整的四层工作流引擎（ControlFlow、Layer 4 基础设施、Orchestrator、多语言 SDK），但仓库缺少面向使用者的 README：新人难以从设计文档快速上手，也无法通过可运行案例理解进程内模式与远程 Orchestrator 模式的差异。现在实现与主 specs 已稳定，需要一份可落地的使用指南。

## What Changes

- 新增根目录 `README.md`：项目简介、安装、快速开始、核心概念、API 速查、完整案例、故障排查
- README 必须包含 **全链路解析流程图**（用户请求 → 编排调度 → Unit 执行管线 → Layer 4 横切 → 结果/Checkpoint），让用户一眼看懂 Uni-Flow「在做什么、怎么做」
- 增补/整理 `examples/` 下可运行或可对照的完整示例（Sequential、Router、Checkpoint 续跑、Orchestrator + SDK）
- README 示例代码须与当前公开 API（`src/index.ts` 导出）一致，使用中文说明为主

## Capabilities

### New Capabilities

- `readme-usage-guide`: 仓库 README 使用指南与完整示例文档的内容与结构要求

### Modified Capabilities

（无 — 不影响现有运行时 capability 的行为要求）

## Impact

- 新增/覆盖：`README.md`
- 可能更新：`examples/`（新示例或完善现有示例注释）
- 不影响：运行时代码、API 契约、测试行为（纯文档与示例）
