# uses 与插件

领域智能以 `uses: namespace.name` 接入，并在运行时注册为 Adapter / 工厂。

## 决策树

```text
需要 Uni-Flow 编排？
├─ TS 进程内 → createEngineFromYaml + registry[uses] = Adapter / 工厂
├─ 任意语言 / 远程 Unit → HTTP Unit（见远程契约）
│     + POST /workflows/from-yaml { yaml, bindings: { "name": { type:http, endpoint } } }
└─ 只想借 Checkpoint/Memory → Sidecar SDK（不替代 YAML 拓扑）
```

## 内置 uses（本期）

| uses | 作用 |
|------|------|
| `builtin.mock` | 测试与示例 |
| `builtin.http` | HTTP Agent 端点（`config.endpoint` 或 bindings） |

业务名如 `accounting.record`：项目内实现 `RuntimeAdapter` 并注册，或暴露 HTTP 再 bindings。

## Unit Wrapper

保留现有 Kernel / LangChain 于 Unit **内部**；外层只换 YAML + ControlFlow。不要一期拆掉领域确定性路径。

复杂 **Composite** 边角：YAML v1 未覆盖时用代码 API `createWorkflowEngine`，顶层仍尽可能 YAML。

## TS 注册

```typescript
const engine = await createEngineFromYaml('./uniflow.workflow.yaml', {
  registry: {
    'accounting.record': recordAdapter,
    'accounting.chat': chatAdapter,
  },
});
```

## Orchestrator bindings（跨语言 / 远程）

```json
{
  "yaml": "...",
  "bindings": {
    "demo.greeter": { "type": "http", "endpoint": "http://127.0.0.1:9101" }
  }
}
```

**Registry 内存态：** Orchestrator 重启后需重新 `from-yaml`；磁盘上的 YAML 文件不会丢失。

## 纪律

- 禁止用 `for` / `while` 手写多 Agent 排班替代 ControlFlow / YAML  
- 复杂 Composite 若不在 YAML v1：用 `createWorkflowEngine` 建子图，顶层仍优先 YAML  
