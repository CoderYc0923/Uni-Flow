# 跨语言

> 参考内容。新人请先走完 [先懂它](../understand/what-it-solves.md) 与 [动手](../hands-on/mock-minimal.md)。

**决策简图：** TS 进程内用 `createEngineFromYaml` + `registry`；跨语言 / 远程 Agent 用 **HTTP Unit** + Orchestrator `from-yaml` + `bindings`；Sidecar 只借 Checkpoint/Memory，不替代编排。

## 快速跑通 demo

见 [`examples/cross-lang/README.md`](https://github.com/CoderYc0923/Uni-Flow/blob/main/examples/cross-lang/README.md)：

```bash
npx tsx examples/cross-lang/ts/start-orch-only.ts
```

- 共享 YAML：`examples/cross-lang/greeter.workflow.yaml`
- 远程 Unit 契约：[远程 Unit 契约](remote-unit.md)
- `POST /workflows/from-yaml`：`{ yaml, bindings?: { "demo.greeter": { type: "http", endpoint } } }`

| 项 | 路径 |
|----|------|
| Python | `sdk/python` |
| Java | `sdk/java` |

**Registry 内存态：** Orchestrator 重启后需重新 `from-yaml`。
