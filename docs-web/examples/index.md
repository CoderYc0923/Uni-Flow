# 示例索引

按 **单项目 TS** 与 **TS↔TS 跨项目** 分类。源码：[GitHub `examples/`](https://github.com/CoderYc0923/Uni-Flow/tree/main/examples)。

| 示例 | 类型 | 说明 | 文档 |
|------|------|------|------|
| Sequential | 代码 + YAML | 单项目进程内顺序执行 | [sequential](/examples/sequential) |
| 记账意图分流 | YAML + Router | 单项目 Router + mock | [accounting-router](/examples/accounting-router) |
| **跨项目 Unit** | TS↔TS Workflow-as-Unit | 子 `/execute` + 父 bindings | [workflow-as-unit](/examples/workflow-as-unit) |
| 跨语言 greeter | SDK + HTTP | 多语言客户端手段演示 | [cross-lang](/examples/cross-lang) |
| YAML 模板 | YAML | qa / rag / … | [`examples/templates/`](https://github.com/CoderYc0923/Uni-Flow/tree/main/examples/templates) |

## 推荐顺序

1. [Sequential](/examples/sequential) / [快速开始](/guide/quickstart) — 单项目完整 Engine  
2. [跨项目 Unit](/examples/workflow-as-unit) — 两 TS 部署互嵌  
3. （可选）[跨语言](/examples/cross-lang) — 非完整 Engine  

## 相关指南

- [安装](/guide/install)
- [跨项目复用](/guide/cross-project)
- [YAML 与 validate](/guide/yaml)
