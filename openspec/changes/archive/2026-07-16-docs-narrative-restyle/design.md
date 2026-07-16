## Context

MkDocs 站点已落地（`docs-site/` + Material + Pages workflow），但内容仍是从旧 README 搬迁的概念目录，开篇堆术语；主题为默认 indigo/深色切换，观感旧。根目录 `Agent统一工作流模式设计.md` 作为理论推导很长，却仍被当成「理解入口」。作者与目标读者（业务开发者）都难在短时间内建立「记账路由场景下 Uni-Flow 是否实用」的心智。

约束：保留 MkDocs Material + 现有 Pages Actions；不实现真实记账业务插件；人读优先，AGENTS/设计长文附属。

## Goals / Non-Goals

**Goals:**

- 站点以「先懂它 → 动手 → 深挖 → 参考」重排；记账意图分流贯穿主路径
- 原理页双栏：设计理由 | 仓库现状（✅/🟡/⬜ + 路径）
- 浅色 Element 风 Material 皮肤
- README 门户、AGENTS 硬规矩、设计长文附录化，三份与站点无长文双写

**Non-Goals:**

- 不换 VitePress / 不重写 Engine
- 不补生产级 accounting Plugin 实现（Mock/示意足够）
- 不镜像 OpenSpec changes 全文进站点

## Decisions

### D1: 叙事脊柱 = 记账 Router

- **选择：** 用户话 → Router → record | general 作为全文主故事。  
- **备选：** 代码审查流水线 → 否决（作深挖副例即可）。  
- 每概念强制三句：解决什么 / 设计原理 / 仓库现状。

### D2: 双栏成熟度（诚实）

- 左「为什么这么设计」，右「现在仓里怎样」。  
- 「是不是空壳」页显式区分：引擎/ControlFlow/YAML/validate = 实；业务插件/部分 Layer4 = 需自备或可选。

### D3: 文档四分法

| 工件 | 真源角色 |
|------|----------|
| `docs-site/` | 人读叙事与教程 |
| `README.md` | 门户 + 链 |
| `AGENTS.md` | AI/协作者约束 |
| `Agent统一工作流模式设计.md` | 附录推导；文首导读「先看站点」 |

### D4: 视觉 = Material + Element 浅色 CSS

- 强制/默认 light；主色约 `#409EFF`；背景 `#fff`/`#f5f7fa`；细边框弱阴影。  
- **备选：** 换 VitePress → 否决（成本高、非讲清原理的关键路径）。

### D5: 导航删并

- 合并碎概念页（如单独以 ControlFlow vs ReAct 占主导）进「核心公式 / 深挖」。  
- 跨语言、契约 → 参考区，不挡主路径。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 记账故事与仓内暂无完整 accounting 示例 | 用 Router YAML + mock 示意；双栏标注 🟡；指 `examples/` 可跑物 |
| Material 再调仍像「文档站皮肤」 | 接受；DoD 是清晰+浅色简约，非品牌站 |
| 设计长文附录后旧外链失效感 | 文首大导读 + README/站点明确「附录」标签 |
| README 与站点再漂移 | 门户 only + AGENTS 约定「深度只改站点」 |

## Migration Plan

1. 改 `mkdocs.yml` nav + 新增/重写叙事页 + `extra.css`  
2. 改 README / AGENTS / 设计长文导读与结构  
3. 删或重定向旧碎页，避免坏链  
4. `mkdocs build --strict`；抽查主路径可读  
5. 回滚：git revert 文档提交（无运行时耦合）

## Open Questions

- 是否在 `examples/` 新增一份最小 `accounting-router` YAML（全 mock）——推荐做，便于「动手」页指认；若任务过重可仅示意块 + 现有 yaml-sequential
