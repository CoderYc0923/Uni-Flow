# 生成附录说明

本附录由 **TypeDoc** 从 TypeScript 源码的 JSDoc **自动生成**，面向查阅公开符号（类、函数、类型）。

## 你需要知道

| 点 | 说明 |
|----|------|
| 语言 | 注解正文为**中文**；标识符与类型名保持英文（与源码一致） |
| 如何更新 | 在仓库根目录运行 `npm run docs:api`，输出写入 `docs-web/reference/generated/` |
| 权威边界 | 编排契约、HTTP 字段表、YAML Schema 仍以[手写手册](/reference/)与 `schemas/` 为准；附录用于「这个导出符号是干什么的」 |
| 入口 | [打开生成附录](/reference/generated/) |

## 建议阅读顺序

1. 先看手写页：[Engine](/reference/engine)、[YAML API](/reference/yaml-api)、[Adapters](/reference/adapters)
2. 再在附录中点进具体函数 / 类型，核对参数与字段注释
3. 上手跑通流程请跟 [安装](/guide/install) → [快速开始](/guide/quickstart)
