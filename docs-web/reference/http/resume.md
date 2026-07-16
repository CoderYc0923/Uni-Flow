# POST /workflows/:id/runs/:runId/resume

## 定义

从检查点恢复已暂停的运行，继续执行 ControlFlow 剩余步骤。

## 用途

- Checkpoint 暂停后继续
- HITL 审批后由引擎内部链式恢复（通常通过 `/hitl` 间接调用）
- 指定 `snapshotId` 恢复到特定快照

## 方法与路径

| 项目 | 值 |
|------|-----|
| 方法 | `POST` |
| 路径 | `/workflows/:id/runs/:runId/resume` |
| Content-Type | `application/json` |

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `string` | 是 | 工作流 ID |
| `runId` | `string` | 是 | 运行 ID |

## 请求 Body

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `snapshotId` | `string` | 否 | 检查点 ID；省略时使用最新快照 |

## 响应

**状态码：** `200 OK`

返回更新后的 [RunRecord](/reference/)，`status` 可能为 `running`、`completed`、`paused` 或 `failed`。

## 错误

| 状态码 | 条件 | Body |
|--------|------|------|
| `500` | 未知 runId、无检查点或恢复失败 | `{ "error": "<message>" }` |

常见错误消息：`Unknown run: <runId>`、`No checkpoint found for run: <runId>`

## 示例

```bash
curl -X POST http://127.0.0.1:8787/workflows/demo/runs/run-1-1710000000000/resume \
  -H "Content-Type: application/json" \
  -d '{"snapshotId":"snap-abc"}'
```

TypeScript SDK：

```typescript
const record = await client.resume('demo', runId, 'snap-abc');
```

## 相关

- [POST .../hitl](/reference/http/hitl)
- [Engine — resume()](/reference/engine)
