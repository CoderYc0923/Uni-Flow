# POST /workflows/:id/runs/:runId/hitl

## 定义

对处于人工介入（Human-in-the-Loop）门控的运行提交审批结果，随后自动触发恢复执行。

## 用途

- 工具调用 / 敏感操作需人工确认
- Security 层返回 `require-hitl` 时由外部系统回调

## 方法与路径

| 项目 | 值 |
|------|-----|
| 方法 | `POST` |
| 路径 | `/workflows/:id/runs/:runId/hitl` |
| Content-Type | `application/json` |

### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `string` | 是 | 工作流 ID |
| `runId` | `string` | 是 | 运行 ID |

## 请求 Body

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `approved` | `boolean` | 是 | — | `true` 批准，`false` 拒绝 |
| `responder` | `string` | 否 | `"user"` | 审批者标识（审计用） |

## 响应

**状态码：** `200 OK`

返回审批并恢复后的 [RunRecord](/reference/)。

内部流程：`respondToHITL(approved, responder)` → `resumeRun(runId)`。

## 错误

| 状态码 | 条件 | Body |
|--------|------|------|
| `500` | 未知 runId 或无活跃 Engine | `{ "error": "Unknown run: <runId>" }` |

## 示例

```bash
curl -X POST http://127.0.0.1:8787/workflows/demo/runs/run-1-1710000000000/hitl \
  -H "Content-Type: application/json" \
  -d '{"approved":true,"responder":"admin@example.com"}'
```

TypeScript SDK：

```typescript
await client.respondHITL('demo', runId, true, 'admin@example.com');
```

## 相关

- [POST .../resume](/reference/http/resume)
- [Layer4 — Security](/reference/layer4)
