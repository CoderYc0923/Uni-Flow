## Why

文档与安装指南已把「在自有 TS 项目里 `npm install uni-flow`」写成目标路径，但包尚未正式发布到 npm，用户只能依赖 Git / `file:`。现在 Engine、YAML、CLI 与文档口径已就绪，需要把 `uni-flow` 作为可安装的 npm 包发出去。

## What Changes

- **发包就绪：** 补齐 `package.json` 元数据（`license`、`repository`、`homepage`、`bugs`、`keywords`、`publishConfig` 等）、根目录 `LICENSE`、确认 `files` / `exports` / `bin` 正确
- **发布前校验：** `npm pack` 预览内容、build + 相关测试、确认不把 `docs-web` / `src` / 密钥打进包
- **执行发布：** 在维护者已登录 npm 的前提下发布 `uni-flow@0.1.0`（或设计约定的首发版本）；记录发布后验证步骤（`npm view` / 干净目录 `npm install uni-flow`）
- **文档对齐：** README / 安装指南改为「已发布」为主路径，Git/`file:` 降为开发贡献路径
- **非 BREAKING**（对已有 API）；首发后消费者首次可从 registry 安装

## Capabilities

### New Capabilities

- `npm-package-publish`: `uni-flow` npm 包元数据、打包边界、首发发布与发布后验证

### Modified Capabilities

- `docs-ts-complete-path`: 安装指南以 `npm install uni-flow` 为默认成功路径（不再把「未发布」写成常态）
- `readme-usage-guide`: README 安装段落与已发布包对齐

## Impact

- `package.json`、根 `LICENSE`、可能的 `prepublishOnly` / `files` 微调
- README、`docs-web/guide/install.md`（及必要时 AGENTS 一句）
- 实际 `npm publish` **需要维护者 npm 账号 / OTP**；CI 自动发布可作为可选后续，本 change 以本机可重复发布流程为主
- 不改 Engine 运行时语义；不强制同时发 Python/Java 包
