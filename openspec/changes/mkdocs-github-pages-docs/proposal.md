## Why

Uni-Flow 能力与文档已分散在根 README、设计长文、`docs/`、`examples/`、OpenSpec 中；根 README 既长又兼做教程，不利于维护与阅读。现在 SDK 完全体已落地，需要一套可检索的文档站（MkDocs Material + GitHub Pages）承载原理、教程与参考，并把 README 收成仓库门户。

## What Changes

- 新增 MkDocs（Material）站点：信息架构、中文主文案、本地预览与构建配置
- 梳理并迁入/改写现有内容：理念与原理、快速开始、YAML/跨语言教程、架构与 Layer4、API/契约索引、FAQ；长设计文可链接或摘要引入
- 新增 GitHub Actions 工作流，将 `mkdocs gh-deploy`（或 `peaceiris/actions-gh-pages` + `mkdocs build`）发布到 GitHub Pages
- **重设计根 `README.md`**：短门户（定位、安装、一分钟上手、文档站链接、示例入口、许可证）；详细教程迁出到文档站，避免双份长文漂移
- 增加 `docs/` 站点源或 `site/` 构建约定与 `requirements-docs.txt`（或等价依赖锁定）
- 不改动运行时 Engine/API 行为；不强制改 openspec 主 specs 语义（文档站可索引指向 `openspec/specs`）

## Capabilities

### New Capabilities

- `mkdocs-documentation-site`: MkDocs Material 站点结构、导航与内容范围要求
- `github-pages-docs-deploy`: GitHub Pages 发布与 CI 工作流要求
- `readme-portal`: 重设计后的根 README 作为简洁门户的结构与内容要求

### Modified Capabilities

- `readme-usage-guide`: 根 README 不再承担完整长教程；详细用法/全链路图等以文档站为准，README 保留最短路径与外链

## Impact

- 新增：`mkdocs.yml`、文档源目录（如 `docs-site/` 或重整后的 `docs/`）、`.github/workflows/docs.yml`、`requirements-docs.txt`
- 更新：`README.md`；可选更新 `AGENTS.md` 指向文档站
- 影响：仓库体积与 CI；需仓库启用 GitHub Pages（用户/维护者操作，文档中说明）
- 不影响：`src/` 运行时行为与现有测试契约
