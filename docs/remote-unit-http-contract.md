# Remote Unit HTTP Contract

Remote Units called via `builtin.http` / `HttpAdapter` expose a single HTTP endpoint.

## Request

- **Method:** `POST`
- **Headers:** `Content-Type: application/json` (plus optional configured headers)
- **Body (JSON):**

```json
{
  "input": {
    "task": "string",
    "context": "optional string",
    "params": {
      "$profile": "optional capability profile id, e.g. rag.v1",
      "...": "open object — pass-through business knobs"
    },
    "delegatedBy": "optional unit id"
  },
  "context": {
    "workflowId": "...",
    "runId": "...",
    "unitId": "...",
    "traceId": "...",
    "assembledContext": { "messages": [], "retrievedDocs": [], "tokenCount": 0, "truncated": false },
    "secrets": {},
    "abortSignal": "(not serialized; abort via connection)"
  }
}
```

Implementations SHOULD read `input.task` at minimum. Extra fields MAY be ignored.  
`input.params` is optional and **pass-through**: the Engine / HttpAdapter MUST NOT strip unknown keys.  
**MUST NOT** put secrets or credentials inside `params`; use binding headers / `context.secrets` (or equivalent) instead.

## Response

- **Status:** `200` on success
- **Body:** `AgentOutput` JSON:

```json
{
  "content": "string",
  "toolCalls": [],
  "stopReason": "stop",
  "metadata": {},
  "tokenUsage": {
    "promptTokens": 0,
    "completionTokens": 0,
    "totalTokens": 0,
    "estimatedCost": 0
  }
}
```

`toolCalls` MUST be an array (empty allowed). `stopReason` SHOULD be one of: `stop` | `length` | `toolUse` | `error` | `cancelled`.

## Notes

- Bindings map `uses` names to `{ "type": "http", "endpoint": "http://host:port/path" }` at `POST /workflows/from-yaml`.
- Do not put secrets in Workflow YAML; put endpoints in bindings / environment.
- Optional `metadata.artifacts` is reserved (pass-through only; engine does not process it). See README / AGENTS.
- Optional `metadata` keys (e.g. `route`, capability-specific fields) are for parent consumers; Engine does not interpret domain metadata.
