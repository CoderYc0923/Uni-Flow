## 1. 主题与导航骨架

- [x] 1.1 更新 `mkdocs.yml`：强制/默认浅色、主色偏 `#409EFF`、挂载 `extra_css`
- [x] 1.2 新增 `docs-site/stylesheets/extra.css`（Element 风：浅底、细边框、弱阴影）
- [x] 1.3 按「先懂它 / 动手 / 深挖 / 参考」重写 nav；删并旧碎页入口

## 2. 叙事内容（先懂它 + 动手）

- [x] 2.1 重写首页：一句话 + 记账痛点 + CTA（先懂它 / 动手）
- [x] 2.2 写「它解决什么」：无编排乱法 vs Router 记账分流清法
- [x] 2.3 写「核心公式」：Unit / ControlFlow / 管线各一句 + 记账角色
- [x] 2.4 写「是不是空壳」双栏对照表（✅/🟡/⬜ + 路径）
- [x] 2.5 写动手：Mock 最小可跑 + 记账 Router YAML/示意 + validate/AGENTS 链
- [x] 2.6 （可选）新增 `examples` 最小 accounting-router mock YAML 或明确指认现有可跑物

## 3. 深挖与参考精简

- [x] 3.1 深挖页：ControlFlow 何时用、Layer4 为何存在（仍用双栏 + 记账钩子）
- [x] 3.2 参考区保留 API/示例/FAQ/Pages；跨语言与契约不挡主路径
- [x] 3.3 清理旧页面或加跳转，避免坏链与重复叙事

## 4. 仓库门户与附录

- [x] 4.1 更新 `README.md`：门户 + 记账一句 + 链 Understand/Hands-on
- [x] 4.2 更新 `AGENTS.md`：硬规矩保留 + 文档站叙事入口路径
- [x] 4.3 `Agent统一工作流模式设计.md`：文首导读附录化；并置记账 Router 示意

## 5. 验收

- [x] 5.1 `mkdocs build --strict` 通过；浅色皮肤抽查
- [x] 5.2 主路径通读：能口头讲清「解决什么 / 空壳边界 / 怎么跑 Mock」
- [x] 5.3 `npm test` 仍通过（文档变更无运行时回归）
