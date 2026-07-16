# GET /workflows/:id/runs/:runId

## 定义

查询指定运行的当前状态、结果或错误信息。

## 用途

- 异步启动后轮询进度
- 获取 `result.state` 中的 `output.<unitId>`
- 检查是否处于 `paused`（如 HITL 等待）

## 方法与路径

| 项目 | 值 |
|------|-----|
| 方法 | `GET` |
| 路径 | `/workflows/:id/runs/:runId` |

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `string` | 是 | 工作流 ID |
| `runId` | `string` | 是 | 运行 ID |

## 请求参数

无 query、无 body。

## 响应

**成功：** `200 OK` — 完整 [RunRecord](/reference/)

| 字段 | 类型 | 说明 |
|------|------|------|
| `runId` | `string` | 运行 ID |
| `workflowId` | `string` | 工作流 ID |
| `status` | `RunStatus` | 当前状态 |
| `createdAt` | `number` | 创建时间戳 |
| `updatedAt` | `number` | 更新时间戳 |
| `result` | `WorkflowResult` | 可选，含 `completedUnits`、`state` |
| `error` | `string` | 失败时的错误消息 |

## 错误

| 状态码 | 条件 | Body |
|--------|------|------|
| `404` | runId 不存在 | `{ "error": "run not found" }` |
| `500` | 服务内部异常 | `{ "error": "<message>" }` |

## 示例

```bash
curl http://127.0.0.1:8787/workflows/yaml-sequential-example/runs/run-1-1710000000000
```

TypeScript SDK：

```typescript
const record = await client.getRun('yaml-sequential-example', runId);
console.log(record.status, record.result?.completedUnits);
```

## 相关

- [POST .../runs](/reference/http/start-run)
- [POST .../hitl](/reference/http/hitl)
