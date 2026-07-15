# GitHub Pages 部署

本仓库用 **官方 GitHub Pages Actions**（`upload-pages-artifact` + `deploy-pages`）发布 MkDocs，不是推 `gh-pages` 分支。

构建产物目录为 `site/`（已写入 `.gitignore`，**不要提交**）。

## 启用步骤

1. 仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**
2. 确认已合并工作流：`.github/workflows/docs.yml`
3. 推送到 `main`，或在 Actions 里对 **Docs** 点 **Run workflow**
4. 在 Actions 中确认出现绿色的 **build** + **deploy**；部署环境名为 `github-pages`
5. `mkdocs.yml` 中站点地址应类似：

```yaml
site_url: https://CoderYc0923.github.io/Uni-Flow/
repo_url: https://github.com/CoderYc0923/Uni-Flow
repo_name: CoderYc0923/Uni-Flow
```

公共 URL：`https://<OWNER>.github.io/<REPO>/`（用户名大小写不敏感，路径里仓库名一般要与 GitHub 仓库名一致）。

## 与旧方式的区别

| 方式 | Pages Source | 说明 |
|------|----------------|------|
| **本仓库（推荐）** | GitHub Actions | `mkdocs build` → artifact → `deploy-pages` |
| `peaceiris` / `mkdocs gh-deploy` | Deploy from a branch（`gh-pages`） | 推分支发布；和「Source = GitHub Actions」不匹配 |

若 Source 选了 GitHub Actions，却用 `peaceiris` 只推分支，站点会一直 **404**。

## 本地构建

```bash
pip install -r requirements-docs.txt
mkdocs build
```

## 维护说明

- 只改 `docs-site/` 与 `mkdocs.yml`；勿提交 `site/`
- 权限失败时检查：Settings → Actions → General → Workflow permissions 允许读写，且 Pages Source = GitHub Actions
- 首次部署后若短暂 404，等 1–2 分钟再刷新
