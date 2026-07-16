# Layer4 组件

Layer4 为 Engine 提供 **策略、安全、上下文、检查点、可观测性** 等横切能力。未传入选项时使用内存默认实现。

## 工厂总览

| 工厂 | 默认实现 | 说明 |
|------|----------|------|
| `createPolicyEngine(config?)` | `DefaultPolicyEngine` | 超时 / 预算 / 熔断 / 限流 |
| `createSecurityGovernance(config?)` | `BasicSecurityGovernance` | 工具白名单 / HITL / 审计 |
| `createFullSecurityGovernance(config)` | `FullSecurityGovernance` | 含 SecretProvider 的完整安全 |
| `createContextManager()` | `InMemoryContextManager` | 会话上下文 |
| `createEnhancedContextManager(options?)` | `EnhancedContextManager` | 增强记忆与向量检索 |
| `createCheckpointStore()` | `InMemoryCheckpointStore` | 内存检查点 |
| `createRedisCheckpointStore(client)` | `RedisCheckpointStore` | Redis 持久化（需 `ioredis`） |
| `createObservability()` | `InMemoryObservability` | 内存追踪 |
| `createOpenTelemetryObservability(hooks?)` | `OpenTelemetryObservability` | OTel 集成（需 `@opentelemetry/api`） |
| `createVectorStore()` | `InMemoryVectorStore` | 内存向量库 |
| `createLongTermMemoryStore()` | `InMemoryLongTermMemoryStore` | 长期记忆 |
| `createFileLongTermMemoryStore(path)` | 文件持久化 | 长期记忆落盘 |
| `createRedisClient(options?)` | `InMemoryRedisClient` | Redis 抽象（测试用内存实现） |

## createPolicyEngine

```typescript
function createPolicyEngine(config?: PolicyConfig): PolicyEngine
```

### PolicyConfig 主要字段

| 字段 | 说明 |
|------|------|
| `retry` | 重试次数与退避 |
| `timeout.unitMs` | 单 Unit 超时 |
| `timeout.workflowMs` | 工作流总超时 |
| `budget.maxTokens` | Token 预算 |
| `budget.maxCost` | 成本预算 |
| `concurrency` | 并发限制 |
| `circuitBreaker` | 熔断阈值 |
| `rateLimit.maxRequestsPerMinute` | 每分钟请求上限 |

YAML `spec.policy` 合并进 `policyConfig`。

## Security

### createSecurityGovernance

```typescript
function createSecurityGovernance(config?: SecurityConfig): SecurityGovernance
```

| SecurityConfig 字段 | 说明 |
|---------------------|------|
| `allowedTools` | 工具白名单 |
| `allowedUnits` | 按 caller 限制 Unit |
| `hitlTools` | 需 HITL 的工具名 |
| `caller` | 默认调用方身份 |

### createFullSecurityGovernance

含 `SecretProvider`（`MapSecretProvider`）与更完整审计链。

## Context

### createContextManager / createEnhancedContextManager

组装 `ExecutionContext.assembledContext`（messages、retrievedDocs、tokenCount 等）。

Orchestrator 配置 `contextManager` 后，`GET /memory/search` 可用。

## Checkpoint

### createCheckpointStore / createRedisCheckpointStore

`engine.resume(runId, snapshotId)` 从 Store 加载快照。

Redis 实现需 optional dependency `ioredis`。

## Observability

### createObservability / createOpenTelemetryObservability

记录 Unit 开始/结束、token 使用、错误等。OTel 版通过 `tryCreateOTelFromPackage()` 探测可选包。

## 传入 Engine

```typescript
const engine = createWorkflowEngine(config, {
  policyEngine: createPolicyEngine(),
  security: createSecurityGovernance({ caller: { id: 'app', roles: ['admin'] } }),
  contextManager: createEnhancedContextManager(),
  checkpointStore: createCheckpointStore(),
  observability: createObservability(),
});
```

或通过 YAML：

```typescript
await createEngineFromYaml('workflow.yaml', {
  engineOptions: { contextManager: createEnhancedContextManager() },
});
```

## 相关

- [Engine](/reference/engine)
- [GET /memory/search](/reference/http/memory-search)
