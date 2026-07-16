# GET /memory/search

## 定义

通过 Orchestrator 配置的 ContextManager 检索长期 / 向量记忆。

## 用途

- RAG 场景召回相关文档片段
- LangChain Sidecar 通过 SDK 拉取历史上下文
- 跨会话记忆查询

## 方法与路径

| 项目 | 值 |
|------|-----|
| 方法 | `GET` |
| 路径 | `/memory/search` |

## Query 参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `q` | `string` | 否 | `""` | 查询文本 |
| `topK` | `number` | 否 | `5` | 返回条数上限 |

## 响应

**成功：** `200 OK`

| 字段 | 类型 | 说明 |
|------|------|------|
| `results` | `MemoryHit[]` | 命中列表 |

### MemoryHit

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 记忆条目 ID |
| `content` | `string` | 文本内容 |
| `score` | `number` | 相关度分数（可选） |

```json
{
  "results": [
    { "id": "mem-1", "content": "用户偏好素食", "score": 0.92 }
  ]
}
```

## 错误

| 状态码 | 条件 | Body |
|--------|------|------|
| `501` | 未配置 ContextManager | `{ "error": "context manager not configured" }` |
| `500` | 检索异常 | `{ "error": "<message>" }` |

## 示例

```bash
curl "http://127.0.0.1:8787/memory/search?q=午饭&topK=3"
```

TypeScript SDK：

```typescript
const { results } = await client.searchMemory('午饭', 3);
```

## 相关

- [Layer4 — ContextManager](/reference/layer4)
- [Python SDK — UniFlowMemory](/reference/python-sdk)
