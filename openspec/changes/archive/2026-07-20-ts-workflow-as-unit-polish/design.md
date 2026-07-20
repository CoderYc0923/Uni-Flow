## Context

用户确认：远期要移植 Engine 到 Py/Java；**近期**只要求 TS 完整 Uni-Flow，且一个 TS 项目能把另一个 TS 项目当 Unit。仓库已有进程内引擎与 `examples/workflow-as-unit/`，缺口在「独立 TS 项目心智」的文档/示例打磨与能力边界表述。并行 change `docs-sdk-install-api-yaml-depth` 覆盖更广的多语言包装，本 change 不依赖它完成。

## Goals / Non-Goals

**Goals:**

1. 读者能在自有 TS 项目中依赖 `uni-flow`，用 YAML 跑完整编排
2. 读者能跟做「子 TS 服务暴露 `/execute` + 父 TS YAML bindings」端到端
3. 文档明确：完整 Engine 仅 TS；Py/Java Engine 移植为远期

**Non-Goals:**

- 移植 Engine 到 Python/Java
- 完成本 change 中的全量 API 清单 / Maven POM（留给其他 change）
- 强制 npm 公开发布（文档写目标命令 + 今日 path/Git 即可）

## Decisions

### D1: 近期成功标准 = TS 完整 + TS↔TS Unit

不以「三语言都能进程内 Engine」为近期验收。

### D2: Demo 保持单仓，文档按两项目讲述

- **选择：** 仍用 `examples/workflow-as-unit/` 单仓演示；README/指南用「项目 A / 项目 B」口吻与端口/bindings 步骤
- **替代：** 拆成两个独立 npm 包示例（成本高）
- **理由：** 验证契约足够；真拆仓可后续做

### D3: 可选导出 Wrapper 助手

- **选择：** 若样板重复，抽出 `createWorkflowAsUnitFromYaml(source)` → `(req) => AgentOutput` 或 http handler 工厂
- **替代：** 仅文档复制 `child-execute-server.ts`
- **理由：** 降低子项目接入摩擦，仍轻入侵

### D4: 与 `docs-sdk-install-api-yaml-depth` 的关系

- 本 change **优先 apply**
- 另一 change 可延后或收窄为「API 清单 + YAML 字段 + 客户端 SDK 安装（非完整引擎）」

## Risks / Trade-offs

- [读者仍以为 pip=完整引擎] → Mitigation：安装/跨项目页显著边界框
- [单仓 demo 不像两项目] → Mitigation：README 明确映射到两部署单元

## Migration Plan

1. 改安装/快速开始/跨项目叙事（TS 优先）
2. 打磨 workflow-as-unit 示例与测试
3. 可选 Wrapper 导出 + 示例改用
4. `docs:build` + 相关测试

## Open Questions

无阻塞。
