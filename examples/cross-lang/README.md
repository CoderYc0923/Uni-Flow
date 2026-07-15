# Cross-language demos（三端轻量）

同一份 YAML：[`greeter.workflow.yaml`](./greeter.workflow.yaml)  
远程 Unit 契约：[`docs/remote-unit-http-contract.md`](../../docs/remote-unit-http-contract.md)

## 三步跑通

### 1. 起 Orchestrator（执行核）

```bash
npm run build
node --import tsx examples/cross-lang/ts/start-orch-only.ts
# 或任意已注册工作流的 Orchestrator；from-yaml 不要求预注册 demo
```

简便：直接跑 TS 全流程 demo（内部自起 Orchestrator + greeter）：

```bash
npx vitest run tests/cross-lang-ts-demo.test.ts
# 或
npx tsx examples/cross-lang/ts/run-ts-demo.ts
```

### 2. 起 HTTP Unit（greeter）

- Python / Java demo 默认自起 `127.0.0.1:9101/execute`
- 若已有 greeter：`SKIP_LOCAL_GREETER=1` 并设置 `GREETER_URL`

### 3. 跑 SDK

**TypeScript**

```bash
npx tsx examples/cross-lang/ts/run-ts-demo.ts
```

**Python**

```bash
pip install -e sdk/python
# 另开终端先起 TS Orchestrator，例如：
npx tsx examples/cross-lang/ts/start-orch-only.ts
python examples/cross-lang/python/run_demo.py
```

**Java**

```bash
javac -d out sdk/java/src/main/java/io/uniflow/sdk/*.java examples/cross-lang/java/RunDemo.java
# Orchestrator 已在 8787
java -cp out io.uniflow.examples.RunDemo
```

## 环境变量

| 变量 | 默认 | 含义 |
|------|------|------|
| `UNIFLOW_URL` | `http://127.0.0.1:8787` | Orchestrator |
| `GREETER_PORT` | `9101` | 本地 Unit 端口 |
| `GREETER_URL` | `http://127.0.0.1:9101/execute` | bindings 目标 |
| `SKIP_LOCAL_GREETER` | unset | `1` 时不自起 Unit |

## Registry 内存态

Orchestrator 进程退出后，已通过 `from-yaml` 注册的工作流会丢失，YAML 文件仍在，重启后需重新注册。
