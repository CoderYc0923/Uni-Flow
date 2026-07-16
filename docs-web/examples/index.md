# 示例索引

以下为仓库内可运行示例，按场景分类。完整源码见 [GitHub `examples/`](https://github.com/CoderYc0923/Uni-Flow/tree/main/examples)。

| 示例 | 类型 | 说明 | 文档 |
|------|------|------|------|
| 记账意图分流 | YAML + Router | 午餐记账 vs 闲聊，Mock 意图路由 | [accounting-router](/examples/accounting-router) |
| Sequential 流水线 | 代码 + YAML | research → write 顺序执行 | [sequential](/examples/sequential) |
| 跨语言 greeter | Orchestrator + HTTP Unit | TS 核 + Py/Java Unit + 三端 SDK | [cross-lang](/examples/cross-lang) |
| YAML 模板库 | YAML | RAG、QA、媒体管道等模板 | [`examples/templates/`](https://github.com/CoderYc0923/Uni-Flow/tree/main/examples/templates) |

## 推荐阅读顺序

1. [Sequential](/examples/sequential) — 理解 Unit + ControlFlow
2. [记账意图分流](/examples/accounting-router) — 理解 Router 与 `uses: builtin.mock`
3. [跨语言](/examples/cross-lang) — Orchestrator + bindings

## 相关指南

- [快速开始](/guide/quickstart)
- [YAML 与 validate](/guide/yaml)
