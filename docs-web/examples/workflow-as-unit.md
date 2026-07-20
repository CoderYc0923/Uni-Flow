# 跨项目 Unit（TS↔TS Workflow-as-Unit）

两个 TypeScript 部署：子项目完整内部 workflow + `/execute`；父项目 bindings 嵌入为一个 Unit。

源码：[examples/workflow-as-unit/README.md](https://github.com/CoderYc0923/Uni-Flow/blob/main/examples/workflow-as-unit/README.md)

```bash
npx vitest run tests/workflow-as-unit-demo.test.ts
npx tsx examples/workflow-as-unit/ts/run-demo.ts
```

概念与跟做：[跨项目复用](/guide/cross-project)。

> 完整 Engine 仅 TS。跨语言 greeter 见 [跨语言](/examples/cross-lang)（手段演示，非完整引擎移植）。
