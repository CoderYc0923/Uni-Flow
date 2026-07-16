# POST /workflows/from-yaml

## 定义

校验 Workflow YAML（`apiVersion: uniflow/v1`），解析 `uses` 与 `bindings`，将工作流注册到 Orchestrator 内存 Registry。

## 用途

- 跨语言场景：Python / Java SDK 上传 YAML + HTTP bindings
- 无需预编译 TS 插件即可挂载远程 HTTP Unit
- CI 注册临时工作流进行集成测试

## 方法与路径

| 项目 | 值 |
|------|-----|
| 方法 | `POST` |
| 路径 | `/workflows/from-yaml` |
| Content-Type | `application/json` |

## 请求 Body

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `yaml` | `string` | 是 | 完整 Workflow YAML 文本 |
| `bindings` | `UsesBindings` | 否 | 远程 Unit 映射，见下表 |

### bindings 条目

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `<usesName>` | `object` | 否 | 键为 YAML 中 `uses` 字符串 |
| `type` | `"http"` | 是 | 当前仅支持 HTTP |
| `endpoint` | `string` | 是 | Remote Unit POST 地址 |
| `headers` | `Record<string, string>` | 否 | 附加 HTTP 头 |

Remote Unit 请求/响应格式：[Remote Unit HTTP Contract](https://github.com/CoderYc0923/Uni-Flow/blob/main/docs/remote-unit-http-contract.md)

## 响应

**成功：** `201 Created`

| 字段 | 类型 | 说明 |
|------|------|------|
| `workflowId` | `string` | 来自 `metadata.id` |
| `note` | `string` | 提示 Registry 为内存态 |

```json
{
  "workflowId": "cross-lang-greeter",
  "note": "Registry is in-memory; re-register after Orchestrator restart."
}
```

## 错误

| 状态码 | 条件 | Body |
|--------|------|------|
| `400` | 缺少 `yaml` 或为空 | `{ "error": "body.yaml (string) is required" }` |
| `400` | Schema / 加载错误 | `{ "error": "<message>", "type": "YamlValidationError" \| "YamlLoadError" }` |
| `500` | 其他内部错误 | `{ "error": "<message>", "type": "Error" }` |

## 示例

```bash
curl -X POST http://127.0.0.1:8787/workflows/from-yaml \
  -H "Content-Type: application/json" \
  -d '{
    "yaml": "apiVersion: uniflow/v1\nkind: Workflow\nmetadata:\n  id: demo\nspec:\n  units:\n    - id: greet\n      uses: demo.greeter\n  flow:\n    type: sequential\n    order: [greet]",
    "bindings": {
      "demo.greeter": {
        "type": "http",
        "endpoint": "http://127.0.0.1:9101/execute"
      }
    }
  }'
```

TypeScript SDK：

```typescript
await client.loadAndRegister(yamlText, {
  'demo.greeter': { type: 'http', endpoint: 'http://127.0.0.1:9101/execute' },
});
```

## 相关

- [uses 与插件](/guide/uses)
- [YAML API — createEngineFromYaml](/reference/yaml-api)
