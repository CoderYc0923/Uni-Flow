# 示例索引

以下为仓库内可运行示例，按**单项目上手**与**跨项目复用**分类。完整源码见 [GitHub `examples/`](https://github.com/CoderYc0923/Uni-Flow/tree/main/examples)。

| 示例 | 类型 | 说明 | 文档 |
|------|------|------|------|
| Sequential 流水线 | 代码 + YAML | research → write 顺序执行 | [sequential](/examples/sequential) |
| 记账意图分流 | YAML + Router | 午餐记账 vs 闲聊，Mock 意图路由 | [accounting-router](/examples/accounting-router) |
| **跨项目 Unit** | Workflow-as-Unit | 子项目完整 workflow，对外 `/execute`；父级 bindings | [workflow-as-unit](/examples/workflow-as-unit) |
| 跨语言 greeter | Orchestrator + HTTP Unit | TS 核 + Py/Java Unit + 三端 SDK（手段演示） | [cross-lang](/examples/cross-lang) |
| YAML 模板库 | YAML | RAG、QA、媒体管道等模板 | [`examples/templates/`](https://github.com/CoderYc0923/Uni-Flow/tree/main/examples/templates) |

## 推荐阅读顺序

1. [Sequential](/examples/sequential) — 理解 Unit + ControlFlow  
2. [记账意图分流](/examples/accounting-router) — 理解 Router 与 `uses: builtin.mock`  
3. [跨项目 Unit](/examples/workflow-as-unit) — 对内 workflow、对外 Unit + `params`  
4. [跨语言 greeter](/examples/cross-lang) — 多语言 SDK 调同一 Orchestrator（可选）

## 相关指南

- [快速开始](/guide/quickstart)
- [跨项目复用](/guide/cross-project)
- [YAML 与 validate](/guide/yaml)
