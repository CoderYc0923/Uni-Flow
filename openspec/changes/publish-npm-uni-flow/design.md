## Context

`package.json` 已声明 `name: uni-flow`、`version: 0.1.0`、`main`/`types`/`exports`/`bin`/`files`（`dist` + `schemas`），但缺少 `license` / `repository` 等 npm 常见元数据，仓库根也无项目 `LICENSE`。文档仍写「未发布时用 Git / file:」。维护者希望正式发到 npm registry。

实际 `npm publish` 依赖账号权限与 OTP；自动化 agent 不能代替用户登录，但可以准备包并在用户授权后执行发布命令。

## Goals / Non-Goals

**Goals:**

- 包元数据与打包边界达到可发布质量
- 首发 `uni-flow@0.1.0`（若 registry 上同名冲突则改策略，见 Open Questions）
- 发布后文档默认写 `npm install virtual-uni-flow`
- 给出可重复的发布检查清单（pack / publish / verify）

**Non-Goals:**

- 不在本 change 搭建完整 GitHub Actions 自动发版（可列为后续）
- 不发 scoped 私有包、不发 Python/Java 工件
- 不改编排语义或抬升 major（除非发现必须）
- 不强制 monorepo 多包拆分

## Decisions

### D1：包名保持 `uni-flow`

- **选择：** 继续用现有 `uni-flow`（与文档、import 一致）
- **备选：** `@coder*` / `@uniflow/*` scoped — 仅当 `npm view uni-flow` 显示被占用且无法拿到所有权时再切换
- **发布前动作：** `npm view uni-flow version`；若 404 则可发；若已存在且非本项目，暂停并改名方案

### D2：首发版本 `0.1.0`

- 与当前 `package.json` 一致；语义上为早期公开 API，允许后续按 semver 演进
- 若需重新发布同版本失败：bump patch（`0.1.1`）而非 `--force`

### D3：打包内容

- **包含：** `dist/**`（含 `cli/uniflow.js`）、`schemas/**`、`LICENSE`、`README.md`（npm 默认带 README）
- **排除：** `src/`、`docs-web/`、`tests/`、`examples/`、`.env*`、OpenSpec 规划目录（已由 `files` 白名单限制）
- **脚本：** `prepublishOnly`: `npm run build`（可选再加 `npm test`；若测试环境脆弱可只 build，但 apply 时至少本地跑通测试）

### D4：许可证

- 默认 **MIT**（开源编排库常见）；写入根 `LICENSE` + `package.json` `"license": "MIT"`
- 若维护者另有偏好，apply 前可改；未指定则 MIT

### D5：发布方式

1. 维护者 `npm login`（或已有 token）
2. `npm pack --dry-run` / `npm pack` 目视
3. `npm publish --access public`（非 scoped 时 access 可省略；scoped 才强制）
4. 验证：`npm view uni-flow`；临时目录 `npm install virtual-uni-flow` + 最小 import

OTP / 2FA：由维护者在终端交互完成；agent 不保存 token。

### D6：文档切换

- `docs-web/guide/install.md`、README：主路径改为 `npm install virtual-uni-flow`；Git/`file:` 移到「贡献者 / 开发本仓」小节
- 与进行中的 `docs-sdk-install-api-yaml-depth` 互补：本 change 只改「TS 已可 npm 安装」事实

## Risks / Trade-offs

- **[Risk] 包名已被占用** → Mitigation：发布前 `npm view`；冲突则改 scoped 名并同步改文档 import 说明（较大，需停下来问用户）
- **[Risk] 打进错误文件或漏 `dist`** → Mitigation：`files` 白名单 + `npm pack` 检查
- **[Risk] 未 build 就 publish** → Mitigation：`prepublishOnly`
- **[Risk] 错误版本无法撤回（npm 24h 内可 unpublish 有限制）** → Mitigation：pack 预览；首发用 0.1.x；严重问题发 deprecate + 新 patch
- **[Risk] 无 LICENSE 导致企业用户不敢用** → Mitigation：根 LICENSE + package.json 字段

## Migration Plan

1. 元数据 + LICENSE + prepublishOnly  
2. build / test / pack  
3. publish（用户授权）  
4. 改文档  
5. 回滚：若刚发布发现问题 → `npm deprecate` 或 24h 内按 npm 政策 unpublish；代码侧文档可再写回 Git 路径

## Open Questions

- 包名 `uni-flow` 在 npm 上是否可用？（apply 第一步验证）
- 许可证是否确认为 MIT？
- 是否需要同时打 git tag `v0.1.0`？（建议是，非阻塞）
