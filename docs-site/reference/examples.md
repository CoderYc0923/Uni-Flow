# 示例目录

| 路径 | 说明 |
|------|------|
| `examples/sequential-pipeline.ts` | Sequential 快速开始完整版 |
| `examples/code-review-workflow.ts` | Router / 混合代码评审 |
| `examples/start-orchestrator.ts` | Orchestrator HTTP 服务 |
| `examples/yaml-sequential.yaml` | YAML + `builtin.mock` |
| `examples/templates/` | Workflow YAML 模板 |
| `examples/cross-lang/` | 跨语言：起核 → 起 Unit → SDK（见其 README） |

## 案例提示

### Sequential

见 [快速开始](../getting-started/quickstart.md) 与 `examples/sequential-pipeline.ts`。

### Router

```typescript
const flow = new RouterFlow(
  router,
  new Map([
    ['quick', quickReview],
    ['deep', securityActor],
  ]),
  (output) => output.content.trim(),
);
```

### 跨语言

按 `examples/cross-lang/README.md` 顺序：Orchestrator → HTTP Unit → Python/Java/TS 客户端。
