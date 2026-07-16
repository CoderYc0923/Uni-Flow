## Why

现有 MkDocs 站点与 README/设计长文以术语堆叠（ControlFlow、Layer4、双轨）开篇，样式偏默认 Material，读者（含作者本人）难以立刻理解 Uni-Flow「解决什么、是否实用、还是空壳」。需要在不换引擎的前提下，用**记账路由业务故事**重梳叙事，并诚实对照设计意图与仓库现状。

## What Changes

- 重排 `docs-site/` 信息架构：先懂它 → 动手 → 深挖 → 参考；以记账/客服意图分流为主故事
- 原理页统一「设计理由 | 仓库现状」双栏；增加「是不是空壳」对照页
- Material 浅色简约皮肤（偏 Element UI）：`extra.css` + palette，去掉深色默认感
- `README.md`：门户文案对齐新叙事（痛点一句 + CTA 链站点），仍不承载长教程
- `AGENTS.md`：保持硬规矩，补充文档站路径与叙事入口链接（不重讲理念）
- `Agent统一工作流模式设计.md`：附录化（文首导读指向站点）；压缩入门噪声；记账案例并置/承接入口角色
- **不**改 Engine/运行时行为；**不**换 VitePress；**不**新做真实记账业务插件

## Capabilities

### New Capabilities

- `docs-narrative-site`: 文档站叙事 IA、记账主故事、双栏成熟度写法、成功标准
- `docs-element-theme`: MkDocs Material 浅色简约（Element 风）主题与样式约束
- `design-doc-appendix`: 根目录设计长文附录化与站点主叙事分工

### Modified Capabilities

- `readme-usage-guide`: 门户摘要与 CTA 对齐新叙事；仍禁止 README 作为长教程唯一真源
- `uniflow-ai-conventions`: AGENTS 增加文档站叙事入口/路径；规矩条文不注水

## Impact

- 触达：`docs-site/**`、`mkdocs.yml`、`README.md`、`AGENTS.md`、`Agent统一工作流模式设计.md`
- 可能新增：`docs-site/stylesheets/extra.css`（或等价自定义样式）
- 不影响：`src/` 运行时、测试契约、OpenSpec 主 specs 中引擎相关需求语义
- 前序 change `mkdocs-github-pages-docs` 的 Pages 发布链路保留；内容与主题在其上迭代
