# Uni-Flow

**TypeScript 完整 Agent 编排标准库**——YAML 拓扑 + ControlFlow + 统一管线；跨项目时把另一个 **TS** 项目当 Unit（Workflow-as-Unit）。Python/Java Engine 移植为远期。

> **Who / Why：** 需要可声明、可校验编排，且能把 TS 能力项目嵌进其他 TS 工作流的团队。  
> **How：** `npm` 接入 → YAML / `createEngineFromYaml` → 需要时子项目暴露 `/execute`。

License: MIT

---

## 文档（VitePress）

| | |
|--|--|
| **本地预览** | `npm run docs:dev`（[`docs-web/`](./docs-web/)） |
| **部署 URL** | https://CoderYc0923.github.io/Uni-Flow/ |
| **安装（自有 TS 项目）** | [docs-web/guide/install.md](./docs-web/guide/install.md) |
| **跨项目 TS↔TS** | [docs-web/guide/cross-project.md](./docs-web/guide/cross-project.md) |
| **为什么选（3W）** | [docs-web/why/three-w.md](./docs-web/why/three-w.md) |
| **API 手册** | [docs-web/reference/](./docs-web/reference/) |
| **示例** | [examples/workflow-as-unit/](./examples/workflow-as-unit/) |
| **AI 硬规矩** | [`AGENTS.md`](./AGENTS.md) |

---

## 安装（消费者项目）

完整 Engine：**仅 TypeScript**。目标：`npm install uni-flow`（未发布时用 Git / `file:` path，见安装指南）。

贡献者克隆本仓：

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
| 跨项目 TS↔TS | [`examples/workflow-as-unit/`](./examples/workflow-as-unit/) |
| 跨语言 SDK（客户端） | [`examples/cross-lang/`](./examples/cross-lang/) |
| 远程 Unit 契约 | [`docs/remote-unit-http-contract.md`](./docs/remote-unit-http-contract.md) |
| 设计长文 | [`docs-web/architecture/design-longform.md`](./docs-web/architecture/design-longform.md) |
