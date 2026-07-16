# Uni-Flow

**编排多个 Agent / 能力的标准库**——拓扑可声明（YAML），领域用插件接入；箱内可挂任意运行时（含 LangGraph）。

> **Who / Why：** 给需要跨项目统一编排、又不想绑死某一家 Agent 框架的团队。  
> **How：** YAML 画排班 → `uses` 注册插件 → Engine 按管线执行。

License: MIT

---

## 文档（VitePress）

| | |
|--|--|
| **本地预览** | `npm run docs:dev`（源码 [`docs-web/`](./docs-web/)） |
| **部署 URL** | https://CoderYc0923.github.io/Uni-Flow/ |
| **为什么选（3W）** | [docs-web/why/three-w.md](./docs-web/why/three-w.md) |
| **原理（两层模型）** | [docs-web/architecture/model.md](./docs-web/architecture/model.md) |
| **API 手册** | [docs-web/reference/](./docs-web/reference/) |
| **示例（含记账分流）** | [docs-web/examples/](./docs-web/examples/) |
| **AI 硬规矩** | [`AGENTS.md`](./AGENTS.md) |

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

更多：[快速开始](./docs-web/guide/quickstart.md) · [记账 Router 示例](./docs-web/examples/accounting-router.md)

```bash
npx uniflow validate ./examples/accounting-router.yaml
```

---

## 链接

| 主题 | 入口 |
|------|------|
| vs LangGraph / 抗模式变动 | [`docs-web/why/`](./docs-web/why/) |
| Schema | [`schemas/uniflow.workflow.schema.json`](./schemas/uniflow.workflow.schema.json) |
| 跨语言 | [`examples/cross-lang/`](./examples/cross-lang/) |
| 远程 Unit 契约 | [`docs/remote-unit-http-contract.md`](./docs/remote-unit-http-contract.md) |
| 设计长文 | [`docs-web/architecture/design-longform.md`](./docs-web/architecture/design-longform.md) |
