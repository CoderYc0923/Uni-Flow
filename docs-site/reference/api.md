# API 速查

| 类别 | 符号 |
|------|------|
| Engine | `createWorkflowEngine`, `DefaultWorkflowEngine` |
| YAML | `createEngineFromYaml`, `validateWorkflowYamlSource`, `loadAndRegister`（SDK）、`YamlValidationError` |
| Cross-lang | `examples/cross-lang/`、`sdk/python`、`sdk/java`、`POST /workflows/from-yaml` |
| State / Bus | `createSharedState`, `createMessageBus` |
| ControlFlow | `LoopFlow`, `SequentialFlow`, `ParallelFlow`, `RouterFlow`, `DAGFlow`, `DelegationFlow`, `CompositeFlow` |
| Adapters | `createMockAdapter`, `createPiAgentAdapter`, `createHttpAdapter`, `createMcpAdapter` |
| Layer 4 | `createContextManager`, `createEnhancedContextManager`, `createCheckpointStore`, `createRedisCheckpointStore`, `createPolicyEngine`, `createSecurityGovernance`, `createFullSecurityGovernance`, `createVectorStore`, `createLongTermMemoryStore`, `createObservability`, `createOpenTelemetryObservability` |
| Orchestrator | `createWorkflowRegistry`, `createOrchestratorServer` |
| SDK | `createUniFlowClient` |
| CLI | `uniflow validate <path>`（需先 `npm run build`） |
| HITL | `createHITLGateUnit`, `approveHITL`, … |

## Orchestrator HTTP（常用）

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/health` | 健康检查 |
| `GET` | `/workflows` | 工作流列表 |
| `POST` | `/workflows/:id/runs` | 启动；`{ input, sync? }` |
| `GET` | `/workflows/:id/runs/:runId` | 查询 |
| `POST` | `/workflows/:id/runs/:runId/resume` | 续跑 |
| `POST` | `/workflows/:id/runs/:runId/hitl` | 审批 |
| `GET` | `/memory/search` | 记忆检索 |
| `POST` | `/mcp` | MCP JSON-RPC |
| `POST` | `/workflows/from-yaml` | YAML + bindings 注册 |

示例服务：`examples/start-orchestrator.ts`。

```typescript
import { createUniFlowClient } from 'uni-flow';

const client = createUniFlowClient({ baseUrl: 'http://127.0.0.1:8787' });
const record = await client.startWorkflow('demo', { task: '…' }, { sync: true });
```

正式需求见仓库 [`openspec/specs/`](https://github.com/OWNER/Uni-Flow/tree/main/openspec/specs)。
