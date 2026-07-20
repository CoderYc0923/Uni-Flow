## Why

使用者无法按「npm / pip / Maven」心智把 Uni-Flow 接入各语言项目；安装指南仍偏「克隆本仓」。API 手册虽有分册，但缺少「全部可用 API + 每个用途」的完整清单。YAML / validate 页有最小示例，但缺少字段级注解与校验原理说明。跨项目「TS 父项目嵌入 Java 子项目 Unit」的安装与快速路径也未写成可跟做的指南。

## What Changes

- **API 文档：** 审计并补齐公开表面清单（HTTP / TS 进程内 / TS·Py·Java SDK）；每个 API 标明用途（用来干什么），缺页补页或在总览中可跳转
- **多语言接入模型：** 文档与指南明确——TS 用 npm 包、Python 用 pip、Java 用 Maven/Gradle；跨语言复用通过远程 Unit（例：Java 子项目 `/execute` → TS 父项目 bindings）
- **安装与快速使用指南：** 三语言安装步骤、最小可跑示例、链到跨项目 Unit 模式
- **YAML 字段级参考：** 对照 Schema 注解全部顶层/units/flow/policy 字段；说明 `uniflow validate` 原理（Ajv + Schema、校验什么/不校验什么）
- **打包缺口（最小可安装）：** Java SDK 补 Maven（或 Gradle）工程以便本地/`install` 依赖；TS/Python 文档写清已发布或 path/`pip install -e` 过渡路径
- **非 BREAKING**（文档与脚手架为主；不改编排语义）

## Capabilities

### New Capabilities

- `docs-api-surface-inventory`: 全部公开 API 清单 + 每项用途说明（与手册页对齐）
- `docs-multilang-sdk-install`: 三语言安装（npm / pip / Maven·Gradle）与快速使用指南
- `docs-yaml-field-reference`: Workflow YAML 全字段注解 + validate 原理页

### Modified Capabilities

- `docs-api-handbook`: 手册页与总览必须覆盖清单中的每个公开表面，并含「用途」段
- `docs-cross-project-composability`: 指南中补「TS 嵌入 Java Unit」等跨语言安装/快速路径示例
- `cross-lang-sdk-yaml`: SDK 安装/依赖声明与文档一致（含 Java 构建元数据缺口）

## Impact

- 文档：`docs-web/guide/install.md`、新/扩 YAML 字段页、API 总览与缺口手册页、跨项目/跨语言指南
- SDK：`sdk/java` 增加 `pom.xml`（或 Gradle）使可依赖；Python/TS README 与门户对齐
- 可能轻触 `package.json` 发布说明（不强制本次实际上架 npm/Maven Central）
- 不改 Engine ControlFlow 行为；不实现生产业务插件
