# uses 与插件

Workflow YAML 中每个 Unit 通过 `uses: <name>` 引用运行时能力。本节说明选型与两种注册方式。

## 决策树

```text
需要 Uni-Flow 编排？
├─ 单项目、TypeScript 进程内
│    → createEngineFromYaml + options.registry[uses] = 插件工厂 / Adapter
├─ 跨项目 / 跨部署复用（对内可为完整 workflow）
│    → 对方暴露 Unit HTTP `/execute`（契约见 Remote Unit HTTP Contract）
│    → POST /workflows/from-yaml { yaml, bindings: { "name": { type, endpoint } } }
│    → 详见「跨项目复用」指南（多语言只是常见结果，不是动机）
└─ 仅需 Checkpoint / Memory 旁路现有图
     → Sidecar SDK（不替代 YAML 拓扑）
```

各项目用本语言 SDK 写编排；HTTP 解决的是**项目与部署边界**，不是「一个工作流里故意混语言」。

YAML v1 无法表达的 Composite 子图 → 用代码 API `createWorkflowEngine` 构建该子图；顶层仍尽量保持 YAML。

## 内置 uses

| uses | 说明 |
|------|------|
| `builtin.mock` | Mock 适配器，测试与演示 |
| `builtin.http` | HTTP 远程 Unit（通常通过 bindings 注入 endpoint） |

## registry（进程内）

在 `createEngineFromYaml` 时传入 `registry`，键为 `uses` 名称：

```typescript
import { createEngineFromYaml, createMockAdapter } from 'uni-flow';

const engine = await createEngineFromYaml('my.workflow.yaml', {
  registry: {
    'my.agent': (config) =>
      createMockAdapter({
        responseFn: () => ({
          content: String(config?.response ?? 'ok'),
          toolCalls: [],
          stopReason: 'stop',
          metadata: {},
        }),
      }),
  },
});
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `registry` | `Record<string, UnitPlugin>` | 键为 YAML 中的 `uses` 字符串 |
| 插件值 | `UnitPlugin` | 工厂函数 `(config?) => RuntimeAdapter \| WorkflowUnit`，或静态 Adapter |

**冲突规则：** 显式 `registry` 与 `bindings` 合并时，**registry 优先**。

`unit.config` 适合**静态默认**；运行时业务策略优先放在 `AgentInput.params`（见 [跨项目复用](/guide/cross-project)）。

## bindings（Orchestrator / 远程）

远程 HTTP Unit 通过 bindings 映射，不在 YAML 里写 endpoint（避免泄露密钥与硬编码环境）：

```json
{
  "yaml": "apiVersion: uniflow/v1\n...",
  "bindings": {
    "demo.greeter": {
      "type": "http",
      "endpoint": "http://127.0.0.1:9101/execute",
      "headers": { "Authorization": "Bearer ..." }
    }
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | `"http"` | 是 | 当前仅支持 HTTP |
| `endpoint` | `string` | 是 | Remote Unit POST 地址 |
| `headers` | `Record<string, string>` | 否 | 额外请求头（放密钥，不要放进 `params`） |

Remote Unit 请求/响应契约：[Remote Unit HTTP Contract](https://github.com/CoderYc0923/Uni-Flow/blob/main/docs/remote-unit-http-contract.md)（含可选 `input.params`）。

## Orchestrator 注册示例

```bash
curl -X POST http://127.0.0.1:8787/workflows/from-yaml \
  -H "Content-Type: application/json" \
  -d '{"yaml":"...", "bindings":{"demo.greeter":{"type":"http","endpoint":"http://127.0.0.1:9101/execute"}}}'
```

## 注意事项

1. **拓扑在 YAML** — 改 `units` / `flow` / `policy`，不要另写 for/while 多 Agent 调度器。
2. **validate 后提交** — `npx uniflow validate <path>`。
3. **Registry 内存态** — Orchestrator 重启后需重新 `from-yaml`；磁盘上的 YAML 不会丢失。

## 下一步

- [跨项目复用](/guide/cross-project)
- [跨语言（手段）](/guide/cross-lang)
- [Adapters 参考](/reference/adapters)
