## 1. 发布前检查

- [x] 1.1 `npm view uni-flow`：确认包名可用或为本项目所有；冲突则暂停改名
- [x] 1.2 确认许可证（默认 MIT）并添加根目录 `LICENSE`

## 2. 包元数据与打包

- [x] 2.1 补齐 `package.json`：`license`、`repository`、`homepage`、`bugs`、`keywords`、`publishConfig`（如需）
- [x] 2.2 增加 `prepublishOnly`（至少 `npm run build`）；复查 `files` / `exports` / `bin`
- [x] 2.3 `npm run build` + 相关测试；`npm pack` 目视 tarball（含 `dist`、`schemas`、`LICENSE`，无密钥）

## 3. 发布

- [x] 3.1 维护者登录 npm 后执行 `npm publish`（首发 `0.1.0`；失败则按 semver bump，勿 force）
- [x] 3.2 发布后验证：`npm view uni-flow`；干净目录 `npm install uni-flow` 可 import

## 4. 文档对齐

- [x] 4.1 更新 `docs-web/guide/install.md`：主路径 `npm install uni-flow`
- [x] 4.2 更新 README（及必要时 AGENTS 一句）安装口径

## 5. 收尾（可选）

- [x] 5.1 记录 registry URL（https://www.npmjs.com/package/virtual-uni-flow）；git tag `v0.1.0` 待工作区提交后再打（避免标到旧提交）
