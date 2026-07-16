# POST /workflows/:id/runs

## 定义

为指定工作流启动一次运行。支持异步（立即返回 `running`）与同步（阻塞至完成或暂停）两种模式。

## 用途

- 触发已注册工作流执行
- 传入初始 `input` 写入 SharedState（如 `task` 字段）
- 集成测试中使用 `sync: true` 等待结果

## 方法与路径

| 项目 | 值 |
|------|-----|
| 方法 | `POST` |
| 路径 | `/workflows/:id/runs` |
| Content-Type | `application/json` |

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `string` | 是 | 工作流 ID（`metadata.id`） |

## 请求 Body

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `input` | `Record<string, unknown>` | 否 | `{}` | 初始共享状态键值 |
| `sync` | `boolean` | 否 | `false` | `true` 时阻塞至完成 / 暂停 / 失败 |

## 响应

**状态码：** `202 Accepted`

返回 [RunRecord](/reference/)：

| 字段 | 类型 | 说明 |
|------|------|------|
| `runId` | `string` | 新运行 ID |
| `workflowId` | `string` | 工作流 ID |
| `status` | `RunStatus` | `running` / `completed` / `paused` / `failed`（sync 时可能已终态） |
| `createdAt` | `number` | 创建时间戳 |
| `updatedAt` | `number` | 更新时间戳 |
| `result` | `WorkflowResult` | sync 完成或暂停时存在 |
| `error` | `string` | sync 失败时存在 |

```json
{
  "runId": "run-1-1710000000000",
  "workflowId": "yaml-sequential-example",
  "status": "completed",
  "createdAt": 1710000000000,
  "updatedAt": 1710000000500,
  "result": {
    "runId": "run-1-1710000000000",
    "completedUnits": ["research", "write"],
    "state": { "task": "demo", "output.write": "written draft" },
    "messages": [],
    "duration": 120,
    "tokenUsage": 60,
    "cost": 0.002
  }
}
```

## 错误

| 状态码 | 条件 | Body |
|--------|------|------|
| `500` | 未知工作流或执行异常 | `{ "error": "<message>" }` |

## 示例

```bash
curl -X POST http://127.0.0.1:8787/workflows/yaml-sequential-example/runs \
  -H "Content-Type: application/json" \
  -d '{"input":{"task":"hello"},"sync":true}'
```

TypeScript SDK：

```typescript
const record = await client.startWorkflow('yaml-sequential-example', { task: 'hello' }, { sync: true });
console.log(record.result?.state['output.write']);
```

## 相关

- [GET .../runs/:runId](/reference/http/get-run)
- [POST .../resume](/reference/http/resume)
