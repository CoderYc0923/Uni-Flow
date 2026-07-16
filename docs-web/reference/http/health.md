# GET /health

## 定义

Orchestrator 健康检查端点，返回服务可用状态与当前内存 Registry 中的工作流 ID 列表。

## 用途

- 负载均衡 / 容器探针
- SDK 连接前快速探测
- 确认 `from-yaml` 注册是否仍在内存中（**重启后需重新注册**）

## 方法与路径

| 项目 | 值 |
|------|-----|
| 方法 | `GET` |
| 路径 | `/health` |

## 请求参数

无 query、无 body。

## 响应

**状态码：** `200 OK`

| 字段 | 类型 | 说明 |
|------|------|------|
| `ok` | `boolean` | 固定为 `true` |
| `workflows` | `string[]` | 已注册工作流 ID 列表 |

```json
{
  "ok": true,
  "workflows": ["yaml-sequential-example", "cross-lang-greeter"]
}
```

## 错误

| 状态码 | 条件 | Body |
|--------|------|------|
| `500` | 服务内部异常 | `{ "error": "<message>" }` |

## 示例

```bash
curl http://127.0.0.1:8787/health
```

TypeScript SDK：

```typescript
const client = createUniFlowClient({ baseUrl: 'http://127.0.0.1:8787' });
const health = await client.health();
console.log(health.workflows);
```

## 相关

- [GET /workflows](/reference/http/workflows)
- [TypeScript SDK — health()](/reference/typescript-sdk)
