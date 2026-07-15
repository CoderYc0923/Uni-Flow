# Uni-Flow

**可依赖的 Agent 统一编排标准库**——用同一套抽象覆盖 ReAct、Plan-Execute、Multi-Agent、Router 等模式，附带生产级横切能力。以 **YAML 为编排真源、代码为领域插件** 的双轨标准。

> 项目依赖 Uni-Flow 引擎；编排优先写 `uniflow.workflow.yaml`（也可用代码 API）；领域智能以 `uses` 插件接入。

## 从这里开始

| 路径 | 说明 |
|------|------|
| [安装](getting-started/install.md) | Node.js 环境与依赖 |
| [快速开始](getting-started/quickstart.md) | Sequential / YAML 最小示例 |
| [设计理念](concepts/philosophy.md) | 为什么用 Uni-Flow |
| [YAML 编排](orchestration/yaml.md) | 拓扑声明与插件注册 |
| [跨语言](orchestration/cross-lang.md) | Python / Java + HTTP Unit |

## 双轨一览

```
uniflow.workflow.yaml  →  编排真源（拓扑 / policy / 路由）
         ↓
 @uni-flow engine      →  运行时
         ↓
  uses: plugins        →  领域 Unit
```

- **能声明的进配置**（顺序、路由、DAG、超时、Token 预算、HITL）
- **领域智能进插件**（Parse、SQL、RAG、FFmpeg……）
- **禁止**各项目再发明第二套「手写 for 循环排班」

## 本地预览本站点

```bash
pip install -r requirements-docs.txt
mkdocs serve
```

浏览器打开提示的本地地址（默认 `http://127.0.0.1:8000`）。

部署到 GitHub Pages 见 [运维说明](ops/github-pages.md)。
