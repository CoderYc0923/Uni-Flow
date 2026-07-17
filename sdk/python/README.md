# Python SDK notes

## Install

```bash
pip install -e sdk/python
# pulls PyYAML + jsonschema
```

## YAML APIs

```python
from uniflow_sdk import UniFlowHttpClient, validate_workflow_yaml

# Local schema validate (same schemas/uniflow.workflow.schema.json)
r = validate_workflow_yaml("examples/cross-lang/greeter.workflow.yaml")
r.raise_for_status()

client = UniFlowHttpClient("http://127.0.0.1:8787")
client.load_and_register(
    "examples/cross-lang/greeter.workflow.yaml",
    bindings={"demo.greeter": {"type": "http", "endpoint": "http://127.0.0.1:9101/execute"}},
)
run = client.start_workflow("cross-lang-greeter", {"task": "hi"}, sync=True)
# Optional business knobs (pass-through to Units / remote HTTP input.params):
# run = client.start_workflow("...", {"task": "hi", "params": {"$profile": "rag.v1", "topK": 5}}, sync=True)
# run["runId"], run["status"], run["result"]["state"]
```

Sidecar (LangGraph/LangChain) remains optional and orthogonal to YAML orchestration.
