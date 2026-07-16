# GET /workflows

## 定义

列出 Orchestrator 内存 Registry 中所有已注册工作流的 ID。

## 用途

- 运行前确认目标 `workflowId` 是否存在
- 运维查看当前可调度工作流集合

## 方法与路径

| 项目 | 值 |
|------|-----|
| 方法 | `GET` |
| 路径 | `/workflows` |

## 请求参数

无。

## 响应

**状态码：** `200 OK`

| 字段 | 类型 | 说明 |
|------|------|------|
| `workflows` | `string[]` | 工作流 ID 数组 |

```json
{
  "workflows": ["accounting-router-demo", "cross-lang-greeter"]
}
```

## 错误

| 状态码 | 条件 | Body |
|--------|------|------|
| `500` | 服务内部异常 | `{ "error": "<message>" }` |

## 示例

```bash
curl http://127.0.0.1:8787/workflows
```

## 相关

- [POST /workflows/from-yaml](/reference/http/from-yaml) — 注册工作流
- [GET /health](/reference/http/health) — 含 `ok` 字段的探针
