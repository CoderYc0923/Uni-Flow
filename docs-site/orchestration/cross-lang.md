# 跨语言

**决策简图：** TS 进程内用 `createEngineFromYaml` + `registry`；跨语言 / 远程 Agent 用 **HTTP Unit** + Orchestrator `from-yaml` + `bindings`；Sidecar 只借 Checkpoint/Memory，不替代编排。

## 快速跑通 demo

仓库说明与步骤见 [`examples/cross-lang/README.md`](https://github.com/OWNER/Uni-Flow/blob/main/examples/cross-lang/README.md)：

```bash
# 1) 起执行核
npx tsx examples/cross-lang/ts/start-orch-only.ts
# 2–3) Python / Java / TS 客户端见 examples/cross-lang/README.md
```

- 共享 YAML：`examples/cross-lang/greeter.workflow.yaml`
- 远程 Unit 契约：[远程 Unit 契约](../reference/remote-unit.md)（仓库 `docs/remote-unit-http-contract.md`）
- `POST /workflows/from-yaml` body：`{ yaml, bindings?: { "demo.greeter": { type: "http", endpoint } } }`

## SDK 路径

| 项 | 路径 |
|----|------|
| 设计长文 | `docs/superpowers/specs/2026-07-14-uniflow-sdk-complete-design.md` |
| Python | `sdk/python` — `validate` / `load_and_register` / `start_workflow` |
| Java | `sdk/java` — 同表面（结构校验 + HTTP） |

## 运行结果常用字段

向业务侧暴露：`runId`、`status`、`result.completedUnits`、`result.state`（如 `output.<unitId>`）。

## Sidecar

| 语言 | 路径 | 能力 |
|------|------|------|
| Python | `sdk/python/uniflow_sdk` | Checkpointer / Memory / Adapters |
| Java | `sdk/java/.../io/uniflow/sdk` | Client / ChatMemoryStore / Adapter |

不替代 LangGraph/LangChain 内部图，只做零/低侵入桥接。

## P3 `artifacts`（预留）

`AgentOutput.metadata.artifacts` / SharedState key `artifacts` 可为 `[{ id, uri?, mimeType?, label? }]`。引擎与 SDK **仅透传**，不实现媒体管线。
