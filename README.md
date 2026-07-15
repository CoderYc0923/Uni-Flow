# Uni-Flow

**可依赖的 Agent 统一编排标准库**——用同一套抽象覆盖 ReAct、Plan-Execute、Multi-Agent、Router 等模式；以 **YAML 为编排真源、代码为领域插件** 的双轨标准。

> **一句话：** 依赖引擎跑编排；拓扑写 `uniflow.workflow.yaml`；领域能力用 `uses` 插件接入。

License: MIT

---

## 文档

| | |
|--|--|
| **完整文档站** | 源码 [`docs-site/`](./docs-site/) · 本地 `pip install -r requirements-docs.txt && mkdocs serve` |
| **部署后 URL** | `https://<OWNER>.github.io/Uni-Flow/`（占位；启用 Pages 后见 [`docs-site/ops/github-pages.md`](./docs-site/ops/github-pages.md)） |
| **Agent 约定** | [`AGENTS.md`](./AGENTS.md) |

深度教程、架构 Mermaid、YAML/跨语言详解、API 与 FAQ → **文档站**，勿在本 README 双写长文。

---

## 安装

Node.js ≥ 18：

```bash
npm install
npm run build
npm test
```

可选：`ioredis`（Redis Checkpoint）、`@opentelemetry/api`（OTel）。

---

## 一分钟上手

最小 Sequential（Mock，无需 LLM Key）：

```typescript
import {
  createWorkflowEngine,
  createSharedState,
  SequentialFlow,
  createMockAdapter,
  DEFAULT_CONTEXT_POLICY,
} from 'uni-flow';
import type { WorkflowUnit } from 'uni-flow';

function makeUnit(id: string, prefix: string): WorkflowUnit {
  return {
    id,
    runtime: createMockAdapter({
      responseFn: (input) => ({
        content: `${prefix}: ${input.task}`,
        toolCalls: [],
        stopReason: 'stop',
        metadata: {},
      }),
    }),
    terminationPolicy: { type: 'stop-reason', reasons: ['stop'] },
    inputAdapter: (state) => ({
      task: (state.get<string>('task') as string) ?? id,
    }),
    outputAdapter: (output, state) => {
      state.set(`output.${id}`, output.content);
    },
    contextPolicy: DEFAULT_CONTEXT_POLICY,
  };
}

const a = makeUnit('research', 'researched');
const b = makeUnit('write', 'written');
const engine = createWorkflowEngine({
  workflowId: 'quickstart',
  units: new Map([['research', a], ['write', b]]),
  controlFlow: new SequentialFlow([a, b]),
  sharedState: createSharedState(),
});
const result = await engine.run({ task: '写一篇 Uni-Flow 简介' });
console.log(result.completedUnits); // ['research', 'write']
```

完整文件：[`examples/sequential-pipeline.ts`](./examples/sequential-pipeline.ts)。  
YAML 路径与 `validate`：见文档站 [快速开始](./docs-site/getting-started/quickstart.md) / [YAML 编排](./docs-site/orchestration/yaml.md)。

---

## 为什么用 / 怎么开始 / 下一步

| | |
|--|--|
| **为什么** | 像 MCP 一样「依赖引擎就能跑」；人与 AI 共用 Schema / `uniflow validate` / Cursor 规则 |
| **怎么开始** | 上方迷你示例 → 或 `examples/yaml-sequential.yaml` |
| **下一步** | [原理与管线](./docs-site/concepts/pipeline.md) · [跨语言](./docs-site/orchestration/cross-lang.md) · [示例索引](./docs-site/reference/examples.md) |

---

## 链接矩阵

| 主题 | 入口 |
|------|------|
| 设计理念 / 四层架构 / 执行管线 | [`docs-site/concepts/`](./docs-site/concepts/) |
| YAML · validate · uses · 跨语言 | [`docs-site/orchestration/`](./docs-site/orchestration/) |
| API · 契约 · FAQ | [`docs-site/reference/`](./docs-site/reference/) |
| Schema | [`schemas/uniflow.workflow.schema.json`](./schemas/uniflow.workflow.schema.json) |
| 模板 | [`examples/templates/`](./examples/templates/) |
| 跨语言 demo | [`examples/cross-lang/`](./examples/cross-lang/) |
| 远程 Unit 契约 | [`docs/remote-unit-http-contract.md`](./docs/remote-unit-http-contract.md) |
| OpenSpec | [`openspec/specs/`](./openspec/specs/) |
| SDK 完全体设计 | [`docs/superpowers/specs/2026-07-14-uniflow-sdk-complete-design.md`](./docs/superpowers/specs/2026-07-14-uniflow-sdk-complete-design.md) |
| 编排理论长文 | [`Agent统一工作流模式设计.md`](./Agent统一工作流模式设计.md) |

路线图见文档站 [OpenSpec 与设计长文索引](./docs-site/reference/openspec-index.md)。

---

## 校验 YAML

```bash
npm run build
npx uniflow validate ./examples/yaml-sequential.yaml
```
