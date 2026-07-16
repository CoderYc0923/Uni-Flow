# Sequential 流水线

本示例展示最简单的 **顺序控制流**：两个 Mock Unit 依次执行，结果写入 SharedState。

## 代码示例

文件：[`examples/sequential-pipeline.ts`](https://github.com/CoderYc0923/Uni-Flow/blob/main/examples/sequential-pipeline.ts)

核心结构：

```typescript
const engine = createWorkflowEngine({
  workflowId: 'sequential-pipeline',
  units: new Map([
    ['research', research],
    ['write', write],
  ]),
  controlFlow: new SequentialFlow([research, write]),
  sharedState: createSharedState(),
});

const result = await engine.run({ task: '写一篇 Uni-Flow 简介' });
```

| 步骤 | Unit | 输出键 |
|------|------|--------|
| 1 | `research` | `output.research` |
| 2 | `write` | `output.write` |

## YAML 等价

文件：[`examples/yaml-sequential.yaml`](https://github.com/CoderYc0923/Uni-Flow/blob/main/examples/yaml-sequential.yaml)

```yaml
flow:
  type: sequential
  order: [research, write]
```

运行 YAML 版本：

```bash
npm run build
npx uniflow validate examples/yaml-sequential.yaml
npx tsx examples/run-yaml-sequential.ts
```

## 运行代码版

```bash
npx tsx examples/sequential-pipeline.ts
```

预期输出包含 `completedUnits: ['research', 'write']` 与非空的 `output.write`。

## 相关文档

- [快速开始](/guide/quickstart)
- [Engine 参考](/reference/engine)
- [YAML API](/reference/yaml-api)
