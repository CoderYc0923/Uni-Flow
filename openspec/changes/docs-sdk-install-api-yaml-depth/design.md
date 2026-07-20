## Context

用户需要按业界习惯接入 Uni-Flow：TS `npm`、Python `pip`、Java Maven/Gradle；跨语言时把异语言子项目当远程 Unit。现状：安装页偏 clone 本仓；Java SDK 仅有源码无 `pom.xml`；API 有分册但缺「全量清单 + 用途」；YAML 页缺字段级注解与 validate 原理。

约束：对齐已归档的跨项目叙事（Workflow-as-Unit、`params`）；YAML-first；轻入侵。

## Goals / Non-Goals

**Goals:**

1. 公开 API 全量清单页（或总览强化），每项含「用途」并可链到手册
2. 三语言安装与快速使用指南（含 TS 父 + Java 子 Unit 示例路径）
3. YAML 全字段参考（对照 Schema）+ validate 原理说明
4. Java SDK 最小 Maven（优先）脚手架，使本地可 `mvn install` / 依赖声明；文档写清 pip / npm 的正式或过渡安装命令

**Non-Goals:**

- 本次强制完成 npm / PyPI / Maven Central **公开发布**（可文档化目标命令；未发布时提供 path / `file:` / `pip install -e` / 本地 Maven）
- 重写全部 TypeDoc 生成页正文
- 改变 Engine / Schema 语义（除非发现文档与 Schema 不一致需纠文档）
- 实现生产级 Java Unit 业务（示例级即可）

## Decisions

### D1: API 清单优先于逐符号扩写

- **选择：** `reference/` 增加或强化「API 清单」：按 HTTP / TS 进程内 / SDK 分组；每行「符号或路由 | 用途一句话 | 链接」
- **替代：** 只靠 TypeDoc（缺用途叙事、HTTP/多语言不全）
- **理由：** 回答「是否列出所有可用 API + 干什么」

### D2: 安装叙事分「目标命令」与「今日可用路径」

| 语言 | 目标 | 今日可写清的路径 |
|------|------|------------------|
| TS | `npm install uni-flow` | 包已备 `package.json`；未发布则 `npm install github:...` 或 workspace path |
| Python | `pip install uniflow-sdk` | `pip install -e sdk/python` |
| Java | Maven/Gradle 坐标 | 新增 `sdk/java/pom.xml` + `mvn install` 本地坐标 |

### D3: 跨语言快速路径写进指南，不另造编排模型

- 复用 Workflow-as-Unit：Java 暴露 `/execute`，TS `bindings` + YAML
- 安装指南 + `guide/cross-project`（或 cross-lang）给出可复制步骤

### D4: YAML 字段页以 Schema 为真源

- 新页或大幅扩展 `guide/yaml.md`：按 `apiVersion` / `metadata` / `spec.units` / `spec.flow.*` / `spec.policy` 表格注解
- validate：Ajv + `schemas/uniflow.workflow.schema.json`；**不** resolve `uses`、不执行；与 load-time 插件解析区分

### D5: Java 用 Maven 最小 POM（非 Gradle 双轨）

- **选择：** 单 `pom.xml`（jar + 可选简单依赖）
- **替代：** 仅 Gradle；或同时维护两者
- **理由：** 降低脚手架成本；Gradle 用户可用 Maven 坐标或后续再加

## Risks / Trade-offs

- [包未上架导致安装命令失败] → Mitigation：文档双轨（目标命令 + 今日路径）醒目标注
- [API 清单与代码漂移] → Mitigation：清单注明对照 `server.ts` / `src/index.ts` 导出；CI 或任务中抽查
- [YAML 页过长] → Mitigation：字段表 + 锚点；flow 各 type 折叠小节

## Migration Plan

1. 写 API 清单与 YAML/validate 深度页
2. 重写 install + 多语言 quick path；更新 nav
3. 加 Java `pom.xml`；对齐 SDK README
4. `docs:build` 通过

## Open Questions

无阻塞。发布到公共 registry 可作为后续 change。
