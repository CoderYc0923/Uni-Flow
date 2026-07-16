# Orchestrator HTTP API

Uni-Flow Orchestrator 是基于 Node 内置 `http` 的轻量 REST 服务，默认监听 `http://127.0.0.1:8787`。

## 路由总表

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/health` | 健康检查与已注册工作流列表 |
| `GET` | `/workflows` | 列出已注册工作流 ID |
| `POST` | `/workflows/from-yaml` | 校验并注册 YAML 工作流 |
| `POST` | `/workflows/:id/runs` | 启动运行（支持 sync） |
| `GET` | `/workflows/:id/runs/:runId` | 查询运行状态与结果 |
| `POST` | `/workflows/:id/runs/:runId/resume` | 从检查点恢复 |
| `POST` | `/workflows/:id/runs/:runId/hitl` | 人工审批 HITL 门 |
| `GET` | `/memory/search` | 语义 / 关键词记忆检索 |
| `POST` | `/mcp` | JSON-RPC MCP 网关 |

## 通用约定

| 项目 | 值 |
|------|-----|
| Content-Type | `application/json` |
| 成功响应 | JSON  body |
| 错误响应 | `{ "error": string, "type"?: string }` |

## Remote Unit 契约

Orchestrator 通过 `bindings` 调用远程 Unit 时，Unit 需实现：

**[Remote Unit HTTP Contract](https://github.com/CoderYc0923/Uni-Flow/blob/main/docs/remote-unit-http-contract.md)**

- 请求：`POST`，body 含 `input` 与 `context`
- 响应：`200` + `AgentOutput` JSON

## 启动 Orchestrator

```bash
npm run build
npx tsx examples/start-orchestrator.ts
# 或
npx tsx examples/cross-lang/ts/start-orch-only.ts
```

## 分路由文档

- [GET /health](/reference/http/health)
- [GET /workflows](/reference/http/workflows)
- [POST /workflows/from-yaml](/reference/http/from-yaml)
- [POST /workflows/:id/runs](/reference/http/start-run)
- [GET /workflows/:id/runs/:runId](/reference/http/get-run)
- [POST .../resume](/reference/http/resume)
- [POST .../hitl](/reference/http/hitl)
- [GET /memory/search](/reference/http/memory-search)
- [POST /mcp](/reference/http/mcp)

## SDK 封装

| SDK | 类 |
|-----|-----|
| TypeScript | `UniFlowClient` |
| Python | `UniFlowHttpClient` |
| Java | `UniFlowClient` |

见 [TypeScript SDK](/reference/typescript-sdk)。
