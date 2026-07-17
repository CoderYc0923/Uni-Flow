# 跨项目 Unit（Workflow-as-Unit）

子项目保留完整内部 workflow；父项目通过 HTTP `/execute` 把它当成**一个 Unit**。

源码与三步说明：[`examples/workflow-as-unit/README.md`](https://github.com/CoderYc0923/Uni-Flow/blob/main/examples/workflow-as-unit/README.md)

## 一句话

```bash
npx vitest run tests/workflow-as-unit-demo.test.ts
# 或
npx tsx examples/workflow-as-unit/ts/run-demo.ts
```

父级传入：

```json
{
  "task": "refund timing",
  "params": { "$profile": "rag.v1", "mode": "fast", "topK": 5 }
}
```

概念说明见 [跨项目复用](/guide/cross-project)。若只想看多语言 SDK 调 Orchestrator，见 [跨语言 greeter](/examples/cross-lang)。
