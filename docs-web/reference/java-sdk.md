# Java SDK

包名：`io.uniflow.sdk`，源码：`sdk/java/src/main/java/io/uniflow/sdk/`。

主类 **`UniFlowClient`** — HTTP 客户端 + 本地 YAML 结构校验。

## 构造

```java
public UniFlowClient(String baseUrl)
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `baseUrl` | `String` | Orchestrator 基址 |

## validate

```java
public WorkflowYaml.Result validate(String yamlOrPath) throws Exception
```

本地 JSON Schema 结构校验（`WorkflowYaml.validate`），不调用 Orchestrator。

`WorkflowYaml.Result` 字段：

| 字段 | 说明 |
|------|------|
| `ok` | 是否通过 |
| `errors` | 错误消息列表 |
| `workflowId` | `metadata.id` |

`raiseForStatus()` 失败时抛出异常。

## loadAndRegister

```java
public String loadAndRegister(String yamlOrPath, String bindingsJson) throws Exception
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `yamlOrPath` | `String` | YAML 文件路径或内联 YAML |
| `bindingsJson` | `String` | bindings JSON 字符串，如 `{"demo.greeter":{"type":"http","endpoint":"..."}}`；可传 `null` 或 `"{}"` |

先本地 validate，再 `POST /workflows/from-yaml`。返回响应 JSON 字符串。

## startWorkflow

```java
public String startWorkflow(String workflowId, String inputJson, boolean sync) throws Exception
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `workflowId` | `String` | 工作流 ID |
| `inputJson` | `String` | input 对象 JSON，如 `{"task":"hello"}`；可 `null` → `{}` |
| `sync` | `boolean` | 是否同步等待 |

→ `POST /workflows/{id}/runs`

## getRun

```java
public String getRun(String workflowId, String runId) throws Exception
```

→ `GET /workflows/{id}/runs/{runId}`，返回 JSON 字符串。

## resume

```java
public String resume(String workflowId, String runId, Optional<String> snapshotId) throws Exception
```

→ `POST .../resume`

## respondHitl

```java
public String respondHitl(String workflowId, String runId, boolean approved, String responder) throws Exception
```

→ `POST .../hitl`

## searchMemory

```java
public String searchMemory(String query, int topK) throws Exception
```

→ `GET /memory/search?q=...&topK=...`

## 错误行为

HTTP 状态码 `>= 400` 时抛出 `RuntimeException`，消息含响应 body。连接失败时提示 Orchestrator 不可达。

## 示例

```java
UniFlowClient client = new UniFlowClient("http://127.0.0.1:8787");

WorkflowYaml.Result v = client.validate("examples/cross-lang/greeter.workflow.yaml");
v.raiseForStatus();

String bindings = "{\"demo.greeter\":{\"type\":\"http\",\"endpoint\":\"http://127.0.0.1:9101/execute\"}}";
client.loadAndRegister("examples/cross-lang/greeter.workflow.yaml", bindings);

String runJson = client.startWorkflow("cross-lang-greeter", "{\"task\":\"world\"}", true);
System.out.println(runJson);
```

Demo：`examples/cross-lang/java/RunDemo.java`

## 相关 Sidecar

| 类 | 说明 |
|----|------|
| `LangChain4jAdapter` | LangChain4j 集成桩 |
| `UniFlowChatMemoryStore` | 聊天记忆 Sidecar |

## 相关

- [Python SDK](/reference/python-sdk)
- [POST /workflows/from-yaml](/reference/http/from-yaml)
