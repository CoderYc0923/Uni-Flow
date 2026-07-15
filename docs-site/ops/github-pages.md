# GitHub Pages 部署

本仓库使用 GitHub Actions 构建 MkDocs 并发布到 GitHub Pages。构建产物目录为 `site/`（已写入 `.gitignore`，**不要提交**）。

## 启用步骤

1. 仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**
2. 确认已合并工作流文件：`.github/workflows/docs.yml`
3. 推送到默认分支（`main`）或手动触发 workflow（`workflow_dispatch`）
4. 部署成功后，将根目录 `mkdocs.yml` 中的占位替换为真实地址：

```yaml
site_url: https://<OWNER>.github.io/Uni-Flow/
repo_url: https://github.com/<OWNER>/Uni-Flow
repo_name: <OWNER>/Uni-Flow
```

公共 URL 模式一般为：`https://<OWNER>.github.io/<REPO>/`。

## 本地构建

```bash
pip install -r requirements-docs.txt
mkdocs build
# 输出在 site/；失败时检查 mkdocs.yml 与 docs-site/ 导航路径
```

## 维护说明

- 文档源只改 `docs-site/` 与 `mkdocs.yml`；勿把 `site/` 提交进 Git
- CI 安装 `requirements-docs.txt` 后执行 `mkdocs build`，再用 `peaceiris/actions-gh-pages` 发布 `site/`
- 若权限失败：检查 workflow 的 `contents: write`（及 Pages 相关）permissions
- README 与站点职责分离：README 只做门户，深度教程只维护在本站点
