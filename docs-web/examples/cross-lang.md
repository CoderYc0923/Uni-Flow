# 跨语言示例

同一份 Workflow YAML（[`examples/cross-lang/greeter.workflow.yaml`](https://github.com/CoderYc0923/Uni-Flow/blob/main/examples/cross-lang/greeter.workflow.yaml)）配合 HTTP greeter Unit，演示 TypeScript Orchestrator 与 Python / Java SDK 协同。

## 前置条件

```bash
npm run build
pip install -e sdk/python   # 若跑 Python demo
```

## 步骤 1：启动 Orchestrator

```bash
npx tsx examples/cross-lang/ts/start-orch-only.ts
```

服务默认：`http://127.0.0.1:8787`。

也可使用一键 TS 全流程（内部自起 Orchestrator + greeter）：

```bash
npx tsx examples/cross-lang/ts/run-ts-demo.ts
```

## 步骤 2：启动 HTTP Unit

- Python / Java demo **默认自启** `127.0.0.1:9101/execute`
- 若已有 greeter 服务：

```bash
export SKIP_LOCAL_GREETER=1
export GREETER_URL=http://127.0.0.1:9101/execute
```

Remote Unit 契约：[Remote Unit HTTP Contract](https://github.com/CoderYc0923/Uni-Flow/blob/main/docs/remote-unit-http-contract.md)

## 步骤 3：运行 SDK

### TypeScript

```bash
npx tsx examples/cross-lang/ts/run-ts-demo.ts
```

### Python

另开终端（Orchestrator 已在 8787）：

```bash
python examples/cross-lang/python/run_demo.py
```

### Java

```bash
javac -d out sdk/java/src/main/java/io/uniflow/sdk/*.java examples/cross-lang/java/RunDemo.java
java -cp out io.uniflow.examples.RunDemo
```

## 环境变量

| 变量 | 默认 | 说明 |
|------|------|------|
| `UNIFLOW_URL` | `http://127.0.0.1:8787` | Orchestrator |
| `GREETER_PORT` | `9101` | 本地 Unit 端口 |
| `GREETER_URL` | `http://127.0.0.1:9101/execute` | bindings endpoint |
| `SKIP_LOCAL_GREETER` | 未设置 | `1` = 不自启 Unit |

## bindings 示例

注册 YAML 时需传入 greeter endpoint：

```json
{
  "demo.greeter": {
    "type": "http",
    "endpoint": "http://127.0.0.1:9101/execute"
  }
}
```

## 注意事项

Orchestrator **Registry 为内存态** — 进程退出后需重新 `POST /workflows/from-yaml`；YAML 文件保留在磁盘。

## 相关文档

- [跨语言指南](/guide/cross-lang)
- [POST /workflows/from-yaml](/reference/http/from-yaml)
- 仓库 README：[`examples/cross-lang/README.md`](https://github.com/CoderYc0923/Uni-Flow/blob/main/examples/cross-lang/README.md)
