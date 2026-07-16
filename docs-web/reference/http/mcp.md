# POST /mcp

## 定义

Orchestrator 暴露的 **JSON-RPC 2.0** MCP 网关，将 MCP `tools/call` 映射到工作流 HTTP API。

## 用途

- Cursor / Claude Desktop 等 MCP 客户端驱动工作流
- 统一工具面：`run_workflow`、`get_run`、`resume_run`、`respond_hitl`

## 方法与路径

| 项目 | 值 |
|------|-----|
| 方法 | `POST` |
| 路径 | `/mcp` |
| Content-Type | `application/json` |

## 请求 Body（JSON-RPC）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `jsonrpc` | `"2.0"` | 否 | 协议版本 |
| `id` | `string \| number \| null` | 否 | 请求 ID |
| `method` | `string` | 是 | RPC 方法名 |
| `params` | `object` | 否 | 方法参数 |

### 支持的方法

| method | 说明 |
|--------|------|
| `initialize` | 握手，返回协议版本与能力 |
| `tools/list` | 列出可用工具 |
| `tools/call` | 调用工具 |

### tools/call — params

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | `string` | 是 | 工具名 |
| `arguments` | `object` | 否 | 工具参数 |

### 可用工具

| 工具名 | arguments | 说明 |
|--------|-----------|------|
| `run_workflow` | `workflowId` (必填), `input?`, `sync?` | 等同 POST .../runs |
| `get_run` | `workflowId`, `runId` (必填) | 等同 GET .../runs/:runId |
| `resume_run` | `workflowId`, `runId` (必填), `snapshotId?` | 等同 POST .../resume |
| `respond_hitl` | `workflowId`, `runId`, `approved` (必填), `responder?` | 等同 POST .../hitl |

## 响应

**状态码：** `200 OK`（JSON-RPC 错误也在 body 的 `error` 字段）

### initialize 结果

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": { "tools": {} },
    "serverInfo": { "name": "uni-flow-orchestrator", "version": "0.1.0" }
  }
}
```

### tools/call 结果

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [{ "type": "text", "text": "{ ... RunRecord JSON ... }" }]
  }
}
```

## 错误

| JSON-RPC code | 条件 |
|---------------|------|
| `-32601` | 未知 `method` 或未知工具名 |

## 示例

```bash
curl -X POST http://127.0.0.1:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "run_workflow",
      "arguments": {
        "workflowId": "yaml-sequential-example",
        "input": { "task": "via-mcp" },
        "sync": true
      }
    }
  }'
```

## 相关

- [POST .../runs](/reference/http/start-run)
- [Adapters — McpAdapter](/reference/adapters)
