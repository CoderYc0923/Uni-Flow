# Uni-Flow

**编排多个 Agent 的引擎**——拓扑写 YAML，领域能力用插件接入。

> **一句话痛点：** 「午饭 32」要记账、「天气怎么样」要闲聊——别用一个大 Prompt 或到处手写 `if/else` 排班；用 Router 把意图分流到不同 Unit。

License: MIT

---

## 文档（先读这里）

| | |
|--|--|
| **人读主路径** | [`docs-site/`](./docs-site/) → [它解决什么](./docs-site/understand/what-it-solves.md) · [是不是空壳？](./docs-site/understand/empty-shell.md) · [动手 Mock](./docs-site/hands-on/mock-minimal.md) |
| **本地预览** | `pip install -r requirements-docs.txt && mkdocs serve` |
| **部署 URL** | https://CoderYc0923.github.io/Uni-Flow/ |
| **AI 硬规矩** | [`AGENTS.md`](./AGENTS.md) |
| **理论附录** | [`Agent统一工作流模式设计.md`](./Agent统一工作流模式设计.md)（请先看文档站） |

---

## 安装

Node.js ≥ 18：

```bash
npm install
npm run build
npm test
```

---

## 一分钟上手（Mock）

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
console.log((await engine.run({ task: 'hello' })).completedUnits);
```

记账意图分流（YAML Mock）：[`examples/accounting-router.yaml`](./examples/accounting-router.yaml)  
说明：[记账路由怎么接](./docs-site/hands-on/accounting-router.md)

```bash
npx uniflow validate ./examples/accounting-router.yaml
```

---

## 链接

| 主题 | 入口 |
|------|------|
| 先懂它 / 动手 / 深挖 | [`docs-site/`](./docs-site/) |
| Schema | [`schemas/uniflow.workflow.schema.json`](./schemas/uniflow.workflow.schema.json) |
| 模板 | [`examples/templates/`](./examples/templates/) |
| 跨语言 | [`examples/cross-lang/`](./examples/cross-lang/) |
| 远程 Unit 契约 | [`docs/remote-unit-http-contract.md`](./docs/remote-unit-http-contract.md) |
