## Context

MkDocs `docs-site/` 已承载叙事重写与 Pages，但栈与内容深度仍不足：缺产品 3W/框架对比/抗性专章；原理章说服力弱；API 非手册级。已确认设计稿见 `docs/superpowers/specs/2026-07-16-vitepress-docs-overhaul-design.md`。

## Goals / Non-Goals

**Goals:**

- VitePress `docs-web/` 成为人读真源；GH Pages Actions 部署
- Why（3W/对比/抗性）+ 原理重梳（两层模型/管线/Layer4/模块 3W）+ 指南 + 示例 + API 手册
- 手写精品 API + TypeDoc 附录（`docs:api`）
- 设计长文入站；README/AGENTS 对齐；退役 MkDocs 主路径

**Non-Goals:**

- 不改 Engine 运行时
- 不做生产记账插件
- 不自研重量级主题

## Decisions

### D1: VitePress in `docs-web/`

- **选择：** 单仓 VitePress，`base: /Uni-Flow/`，默认主题 + 轻品牌色。  
- **备选：** 继续 MkDocs → 否决（用户要求）；双站 TypeDoc 独立 → 否决（导航成本）。

### D2: Content spine

- Why 先于示例；记账**仅**示例区。  
- 原理论证链：问题 → 约束 → 结构 → 证据 → 边界。  
- 模块统一 3W 模板；顶层明确非 Think/Execute/Observe。

### D3: API production

- 精品手写：HTTP 全路由、TS/Py/Java 主 SDK、Engine/YAML/ControlFlow/Adapters/Layer4。  
- 附录：TypeDoc → `docs-web/reference/generated/`；`docs:build` 含 `docs:api`。  
- HTTP 对账：`src/orchestrator/server.ts` + `docs/remote-unit-http-contract.md`。

### D4: CI / Pages

- Node：`npm run docs:build` → upload-pages-artifact → deploy-pages。  
- 废弃 MkDocs Python / peaceiris/`site/` 主路径。

### D5: File roles

| 工件 | 角色 |
|------|------|
| `docs-web/**` | 人读真源 |
| `README.md` | 门户 |
| `AGENTS.md` | 硬规矩 + 链新站 |
| 设计长文 | 迁入站点附录 |
| 远程 Unit 契约 md | 真源；站点摘要+链 |

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 手写 API 漂移 | TypeDoc 附录 + 定期 docs:api；HTTP 对账清单 |
| 一期体量大 | 按迁移步骤顺序；公开面精品优先 |
| base path 错 | 固定 `/Uni-Flow/` |
| MkDocs 残留双站 | 明确退役并改 README 链接 |

## Migration Plan

1. VitePress 脚手架 + nav + workflow  
2. Why + 原理重梳  
3. 指南 + 示例  
4. API 精品 + TypeDoc  
5. 长文迁入；README/AGENTS；退役 MkDocs  
6. `docs:build` + `npm test`  

回滚：git revert 文档/CI；无运行时耦合。

## Open Questions

无（已在 brainstorming 决议）。实现细节以本 design 与仓库设计稿为准。
