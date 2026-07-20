# Workflow-as-Unit demo（TS↔TS）

用**一个仓库**模拟两个 TypeScript 部署单元：

| 角色 | 进程 | 职责 |
|------|------|------|
| **子项目 B** | `child-execute-server` | 内部跑 `child-internal.workflow.yaml`；对外 `POST /execute` |
| **父项目 A** | Orchestrator + parent YAML | `bindings` 指向子 URL；sync run，可带 `params` |

契约：[`docs/remote-unit-http-contract.md`](../../docs/remote-unit-http-contract.md)  
指南：[跨项目复用](../../docs-web/guide/cross-project.md)

## Files

| Path | Role |
|------|------|
| `child-internal.workflow.yaml` | 子内部 Sequential（retrieve → answer） |
| `parent.workflow.yaml` | 父：单 Unit `child.capability` |
| `ts/child-execute-server.ts` | 子 HTTP；使用 `createWorkflowAsUnitHttpHandler` |
| `ts/run-demo.ts` | 同时拉起子 + Orchestrator + 父 run |

## 一键

```bash
npx tsx examples/workflow-as-unit/ts/run-demo.ts
npx vitest run tests/workflow-as-unit-demo.test.ts
```

## 拆成两进程（更像真实两项目）

**终端 1 — 子：**

```bash
npx tsx examples/workflow-as-unit/ts/child-execute-server.ts
# → http://127.0.0.1:9201/execute
```

**终端 2 — 父：** 起 Orchestrator，再 `from-yaml` + bindings：

```json
{
  "child.capability": {
    "type": "http",
    "endpoint": "http://127.0.0.1:9201/execute"
  }
}
```

run input 示例：

```json
{
  "task": "refund timing",
  "params": { "$profile": "rag.v1", "mode": "fast", "topK": 5 }
}
```

## 复制到你的子项目

依赖 `uni-flow` 后：

```typescript
import { createWorkflowAsUnitHttpHandler } from 'uni-flow';
// createServer(createWorkflowAsUnitHttpHandler(yaml, { contentStateKey: 'output.xxx' }))
```

这就是「TS 项目当 Unit」的复制点；父项目只需 YAML + bindings，不必知道子内部 Unit id。

## 注意

- 父 YAML **只有一个** unit id，没有子内部 `retrieve`/`answer`。
- `params` 经 HttpAdapter 整包传到子；子可用 `runWorkflowAsUnit` / handler 映射进内部 `engine.run`。
- 组合主路径是 `/execute`，不是父去 `runs` 子的整个 Orchestrator workflow。
