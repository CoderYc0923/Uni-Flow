# Python SDK

包路径：`sdk/python`，安装：

```bash
pip install -e sdk/python
```

主 HTTP 客户端：**`UniFlowHttpClient`**。YAML 校验：**`validate_workflow_yaml`**。

## UniFlowHttpClient

```python
class UniFlowHttpClient:
    def __init__(self, base_url: str, headers: Optional[Dict[str, str]] = None) -> None
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `base_url` | `str` | Orchestrator 基址（自动去除末尾 `/`） |
| `headers` | `dict` | 可选附加 HTTP 头 |

### health

```python
def health(self) -> dict
```

→ `GET /health`

### validate

```python
def validate(
    self,
    source: Union[str, Path],
    schema_path: Optional[Union[str, Path]] = None,
) -> ValidationResult
```

本地 Schema 校验，**不调用 Orchestrator**。

### load_and_register

```python
def load_and_register(
    self,
    source: Union[str, Path],
    bindings: Optional[Dict[str, Dict[str, Any]]] = None,
) -> dict
```

先本地 `validate`，再 `POST /workflows/from-yaml`。

| bindings 值字段 | 类型 | 说明 |
|----------------|------|------|
| `type` | `"http"` | 必填 |
| `endpoint` | `str` | Remote Unit URL |
| `headers` | `dict` | 可选 |

### start_workflow

```python
def start_workflow(
    self, workflow_id: str, input_data: Optional[dict] = None, sync: bool = False
) -> dict
```

→ `POST /workflows/{id}/runs`  
`input_data` 可含 `task` 与可选 `params`（透传给 Unit / Remote Unit，勿放密钥）。

### get_run

```python
def get_run(self, workflow_id: str, run_id: str) -> dict
```

### resume

```python
def resume(self, workflow_id: str, run_id: str, snapshot_id: Optional[str] = None) -> dict
```

### respond_hitl

```python
def respond_hitl(
    self, workflow_id: str, run_id: str, approved: bool, responder: str = "python-sdk"
) -> dict
```

### search_memory

```python
def search_memory(self, query: str, top_k: int = 5) -> dict
```

→ `GET /memory/search?q=...&topK=...`

## validate_workflow_yaml

```python
def validate_workflow_yaml(
    source: Union[str, Path],
    schema_path: Optional[Union[str, Path]] = None,
) -> ValidationResult
```

| 返回字段 | 类型 | 说明 |
|----------|------|------|
| `ok` | `bool` | 是否通过 |
| `errors` | `List[str]` | 错误列表 |
| `workflow_id` | `str \| None` | `metadata.id` |

`ValidationResult.raise_for_status()` 失败时抛出 `ValueError`。

默认 Schema：`schemas/uniflow.workflow.schema.json`（相对仓库根目录）。

依赖：`pyyaml`、`jsonschema`。

## Bridge 概览（Sidecar）

| 模块 | 类 | 说明 |
|------|-----|------|
| `langchain_bridge` | `UniFlowMemory` | LangChain `BaseMemory` 兼容；通过 HTTP 检索记忆 |
| `langchain_bridge` | `LangChainAdapter` | 将 LangChain chain 包装为 Unit |
| `langgraph_bridge` | （见源码） | LangGraph 集成桩 |

Sidecar **不替代 YAML 拓扑**，仅提供 Memory / Adapter 旁路能力。

## 示例

```python
from uniflow_sdk import UniFlowHttpClient, validate_workflow_yaml

result = validate_workflow_yaml("examples/cross-lang/greeter.workflow.yaml")
result.raise_for_status()

client = UniFlowHttpClient("http://127.0.0.1:8787")
client.load_and_register(
    "examples/cross-lang/greeter.workflow.yaml",
    bindings={"demo.greeter": {"type": "http", "endpoint": "http://127.0.0.1:9101/execute"}},
)
run = client.start_workflow("cross-lang-greeter", {"task": "world"}, sync=True)
print(run["result"]["state"])
```

Demo：`examples/cross-lang/python/run_demo.py`

## 相关

- [跨语言指南](/guide/cross-lang)
- [Java SDK](/reference/java-sdk)
