## Why

VitePress「生成附录 (TypeDoc)」目前基本是英文符号名堆砌，缺少中文说明，也几乎没有用途 / 参数 / 返回值级的可读注解，用户无法当手册用。同时指南（安装、快速开始、YAML、跨项目等）偏「已经懂编排的人」摘要，缺少把小白从零带进门的分步教程。

## What Changes

- **TypeDoc / 公开 API 注解：** 对 `src/` 对外导出表面补齐中文 JSDoc（用途、参数、返回、关键类型字段）；必要时调整 `typedoc.json` / 生成附录入口说明，使 `docs:api` 产出可读的中文附录
- **生成附录呈现：** 在 VitePress 参考区标明附录定位（自动生成、以源码注解为准），并保证关键工厂 / 类型在附录中有足够说明，而不是仅类名列表
- **小白分步教程：** 重写或大幅扩写指南教程（至少安装 → 第一个进程内工作流 → YAML 最小图 → 跨项目 Unit 可选），按「前置 → 一步一步命令/代码 → 预期输出 → 常见问题」结构，对标常见在线教程
- **与既有 change 分工：** 不替代进行中的 `docs-sdk-install-api-yaml-depth`（多语言安装清单 / YAML 全字段对照）；本 change 聚焦 **中文 TypeDoc 附录质量** 与 **TS 主路径小白教程深度**
- **非 BREAKING**（文档与注释为主；不改变运行时语义）

## Capabilities

### New Capabilities

- `docs-typedoc-zh-api`: 公开 API 中文 JSDoc 标准 + TypeDoc 生成附录可读性要求
- `docs-beginner-tutorials`: 指南区小白分步教程（安装/快速开始/YAML，以及跨项目跟做深度）

### Modified Capabilities

- `docs-api-handbook`: 手写 API 手册与生成附录的关系（交叉链接、中文一致性、关键 API 不得只靠无说明英文附录）
- `docs-ts-complete-path`: 安装/快速开始须达到「零基础可跟做」的步骤粒度
- `vitepress-documentation-site`: 生成附录导航/页眉说明反映中文用户手册定位

## Impact

- 源码：`src/**` 对外导出处的 JSDoc（中文）；可能触及 `typedoc.json`、`package.json` 的 `docs:api` 脚本
- 文档：`docs-web/guide/*`（尤其 install / quickstart / yaml / cross-project）、`docs-web/reference/*` 与 `docs-web/reference/generated/**`（生成物）
- 验证：`npm run docs:api` / `docs:build`；抽查附录中关键符号有中文用途与参数说明
- 不改 Engine / ControlFlow 行为；不强制完成本仓全部内部类型的逐字段中文（以 **公开入口与用户会碰到的类型** 为优先）
