## Context

当前 `typedoc.json` 从 `src/index.ts` 生成 `docs-web/reference/generated/`，VitePress 侧栏称为「生成附录 (TypeDoc)」。源码 JSDoc 多为空或英文短语，附录对中文用户几乎不可用。指南页（install / quickstart / yaml / cross-project）已按 TS 完整路径改过一轮，但仍是短摘要，缺少「复制命令 → 看到输出 → 下一步」的教程节奏。

并行 change `docs-sdk-install-api-yaml-depth` 覆盖多语言安装清单与 YAML 全字段对照；本设计不抢那一块，只加深 **中文 TypeDoc** 与 **TS 小白教程**。

## Goals / Non-Goals

**Goals:**

- 公开导出的关键工厂、类型、类方法具备中文 JSDoc（用途 + 参数 + 返回 + 重要字段）
- `docs:api` 生成的附录可读，并在参考区标明「自动生成、以源码为准」
- 指南教程把读者当小白：分步、可验证、有预期结果与常见坑

**Non-Goals:**

- 不为每个内部实现细节 / 测试专用符号写中文文档
- 不在本 change 完成 Python/Java 完整 Engine 或 pip/Maven「完整编排」叙事
- 不替代手写 HTTP / YAML API 手册的深度字段表（可与 `docs-sdk-install-api-yaml-depth` 互补）
- 不引入第二套文档生成器（保持 TypeDoc + typedoc-plugin-markdown）

## Decisions

### D1：中文写在源码 JSDoc，而不是手改 generated/

- **选择：** 在 `src/` 对外符号上写中文 JSDoc；`docs:api` 覆盖 `docs-web/reference/generated/`
- **理由：** 生成物不可手维；CI/`docs:build` 会覆盖
- **备选：** 仅在 VitePress 手写全部 API → 与 TypeDoc 双轨易漂移，否决作为主路径

### D2：注解优先级（分层）

1. **P0：** 用户入口——`createWorkflowEngine`、`createEngineFromYaml`、`validateWorkflowYaml*`、`runWorkflowAsUnit` / `createWorkflowAsUnitHttpHandler`、`createMockAdapter` / 主要 RuntimeAdapter 工厂、`UniFlowClient`、Orchestrator 启动相关导出、`AgentInput` / `AgentOutput` / SharedState 关键类型
2. **P1：** ControlFlow 类与常用 options 类型
3. **P2：** 其余从 `src/index.ts` 再导出的公开符号——至少一行中文「用途」摘要；复杂方法补 `@param` / `@returns`

### D3：JSDoc 模板约定

每个 P0/P1 符号至少包含：

- 首段：中文用途（做什么、何时用）
- `@param` / `@returns`（或属性表式 `@property`）中文
- 必要时 `@example`（短、可复制；可用 Mock，不依赖真实 LLM）
- 类型字段：对用户会填的 options / input / output 字段用 `@property` 或接口成员注释说明含义与约束（如「勿放 secrets」）

标识符与类型名保持英文（代码真实名称）；说明文字用中文。

### D4：TypeDoc / 站点呈现

- 保持 markdown 插件；可在 `typedoc.json` 增加 `name`、`titleLink` 或自定义 frontmatter（若插件支持）以便侧栏标题更友好
- 在 `docs-web/reference/` 增加或更新导读页（或 generated 入口上方说明）：附录为自动生成、语言为中文注解、完整契约以手写手册 + Schema 为准
- 手写手册页对 P0 API 保留（或加强）中文参数表，并链接到生成附录对应符号——避免「只有英文附录」

### D5：小白教程结构

统一章节骨架（可按页裁剪）：

1. 你将完成什么（一句话）
2. 前置（Node 版本、目录、是否需克隆本仓）
3. 步骤 N：命令或完整文件内容
4. 预期现象（终端输出 / `status` / `result.state` 关键字段）
5. 常见问题（路径依赖失败、validate 报错、忘记 registry 等）
6. 下一篇链接

覆盖顺序：`install` → `quickstart`（代码 API + YAML 两条路径都拆成可跟做）→ `yaml`（从空文件到 Sequential）→ `cross-project`（在已有单项目基础上加父子 Unit，步骤更细）。

### D6：与 `docs-sdk-install-api-yaml-depth` 的边界

| 本 change | 另一 change |
|-----------|-------------|
| 中文 TypeDoc / JSDoc | 全 API 表面清单（含 HTTP/SDK） |
| TS 小白分步教程 | 三语言安装 + YAML 全字段 Schema 对照 |
| 不强制 Java pom | 可含 Java 构建脚手架 |

若两 change 都改同一指南页：本 change 优先「步骤粒度」；另一 change 优先「多语言段落」——apply 时合并，避免互相覆盖整页。

## Risks / Trade-offs

- **[Risk] 公开表面很大，全量中文耗时长** → Mitigation：严格按 P0→P1→P2；tasks 分批勾选，P2 可「一行用途」过关
- **[Risk] 中英混排导致 TypeDoc 渲染怪异** → Mitigation：说明用中文、标识符保持英文；抽查生成页
- **[Risk] 教程过长劝退** → Mitigation：每页一条主路径；进阶折叠或链到 examples
- **[Risk] 与进行中文档 change 冲突** → Mitigation：D6 边界 + apply 前 diff 同页

## Migration Plan

1. 补 JSDoc → `npm run docs:api` → 目视抽查 generated
2. 扩写指南 → `npm run docs:build`
3. 无运行时迁移；回滚即还原注释与 md

## Open Questions

- npm 包正式名/发布状态是否在教程里写「暂用 path/Git」——沿用当前 install 口径即可
- 是否要对 generated 开启 `categorizeByGroup` 等 TypeDoc 选项以改善导航——实现时按可读性试一次，非阻塞
