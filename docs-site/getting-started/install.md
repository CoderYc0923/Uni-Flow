# 安装

## 要求

- Node.js ≥ 18

## 从源码安装（本仓库）

```bash
npm install
npm run build
npm test
```

业务项目可通过 `npm link`、path 依赖，或从源码 `import './src/index.js'` 引用。

## 可选依赖

| 包 | 用途 |
|----|------|
| `ioredis` | Redis Checkpoint |
| `@opentelemetry/api` | OTel 导出 |

## 文档站本地预览

文档依赖与引擎运行时分离：

```bash
pip install -r requirements-docs.txt
mkdocs serve
```

## CLI

校验 Workflow YAML（需先 `npm run build`）：

```bash
npx uniflow validate ./uniflow.workflow.yaml
# 或
node dist/cli/uniflow.js validate ./examples/yaml-sequential.yaml
```
