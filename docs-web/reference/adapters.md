# Runtime Adapters

Adapter 实现 **`RuntimeAdapter`** 接口，封装具体 Agent 运行时（Mock、Pi、HTTP、MCP）。

## 工厂总览

| 工厂 | 类型 | 用途 |
|------|------|------|
| `createMockAdapter(options?)` | `mock` | 测试 / 演示 |
| `createPiAgentAdapter(config)` | `pi-agent` | pi-agent-core 集成 |
| `createHttpAdapter(config)` | `http` | Remote Unit HTTP 调用 |
| `createMcpAdapter(config)` | `mcp` | MCP 工具调用 |

## createMockAdapter

```typescript
function createMockAdapter(options?: MockAdapterOptions): MockRuntimeAdapter
```

### MockAdapterOptions

| 字段 | 类型 | 说明 |
|------|------|------|
| `responseFn` | `(input: AgentInput) => AgentOutput \| Promise<AgentOutput>` | 自定义响应 |
| `delayMs` | `number` | 模拟延迟 |
| `frameworkName` | `string` | 框架标识 |

YAML `uses: builtin.mock` 内部使用 MockAdapter；`config.response` / `config.route` 注入 mock 行为。

## createPiAgentAdapter

```typescript
function createPiAgentAdapter(config: PiAgentAdapterConfig): PiAgentAdapter
```

### PiAgentAdapterConfig

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `executeFn` | `(input, ctx) => Promise<AgentOutput>` | 是 | Agent 执行逻辑 |
| `systemPrompt` | `string` | 否 | 系统提示 |
| `steerFn` | `(content: string) => void` | 否 | steering 回调 |
| `followUpFn` | `(content: string) => void` | 否 | follow-up 回调 |
| `cancelFn` | `() => void` | 否 | 取消回调 |

依赖：`@mariozechner/pi-agent-core`

## createHttpAdapter

```typescript
function createHttpAdapter(config: HttpAdapterConfig): HttpAdapter
```

### HttpAdapterConfig

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `endpoint` | `string` | 是 | Remote Unit POST URL |
| `headers` | `Record<string, string>` | 否 | 附加头 |
| `fetchFn` | `typeof fetch` | 否 | 自定义 fetch |

请求体：`{ input, context }`（`context` 为 `ExecutionContext`）。  
响应：`AgentOutput` JSON。

契约：[Remote Unit HTTP Contract](https://github.com/CoderYc0923/Uni-Flow/blob/main/docs/remote-unit-http-contract.md)

YAML bindings `{ type: "http", endpoint }` 通过 `registryFromBindings` 生成 HttpAdapter 插件。

## createMcpAdapter

```typescript
function createMcpAdapter(config: McpAdapterConfig): McpAdapter
```

### McpAdapterConfig

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `serverUrl` | `string` | 是 | MCP 服务地址 |
| `toolName` | `string` | 否 | 默认工具名 |
| `callFn` | `(serverUrl, input, ctx) => Promise<AgentOutput>` | 是* | MCP 调用实现 |

\* 未配置 `callFn` 时 `execute` 抛出错误。生产环境需注入真实 MCP 客户端。

## RuntimeAdapter 通用方法

| 方法 | 说明 |
|------|------|
| `execute(input, ctx)` | 执行 Agent |
| `steer(content)` | 运行中注入 |
| `followUp(content)` | 追加输入 |
| `subscribe(handler)` | 事件订阅 |
| `cancel()` | 取消 |
| `frameworkInfo()` | 框架名与版本 |

## 相关

- [uses 与插件](/guide/uses)
- [Adapters 源码](https://github.com/CoderYc0923/Uni-Flow/tree/main/src/adapters)
