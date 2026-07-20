# TypeScript SDK

包名 `uni-flow`，主类 **`UniFlowClient`**。支持 **remote**（Orchestrator HTTP）与 **in-process**（本地 Engine）双模式。

## createUniFlowClient

```typescript
function createUniFlowClient(
  options?: UniFlowClientOptions,
  engineOptions?: WorkflowEngineOptions,
): UniFlowClient
```

工厂函数，等价于 `new UniFlowClient(options, engineOptions)`。

## 构造函数与选项

```typescript
new UniFlowClient(options?: UniFlowClientOptions, defaultEngineOptions?: WorkflowEngineOptions)
```

### UniFlowClientOptions

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `baseUrl` | `string` | 否 | Orchestrator 基址；省略则为 in-process 模式 |
| `fetchFn` | `typeof fetch` | 否 | 自定义 fetch（测试 / Node 旧版） |
| `headers` | `Record<string, string>` | 否 | 远程模式附加请求头（如 Authorization） |

### mode（只读属性）

| 值 | 条件 |
|----|------|
| `'remote'` | 设置了 `baseUrl` |
| `'in-process'` | 未设置 `baseUrl` |

## register

```typescript
register(
  workflowId: string,
  factory: () => { config: WorkflowConfig; options?: WorkflowEngineOptions },
): void
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `workflowId` | `string` | 工作流 ID |
| `factory` | `function` | 返回 `WorkflowConfig` 的工厂 |

**仅 in-process 模式有效**；remote 模式忽略。

## health

```typescript
async health(): Promise<{ ok: boolean; workflows?: string[] }>
```

| 模式 | 行为 |
|------|------|
| remote | `GET /health` |
| in-process | `{ ok: true, workflows: 已 register 的 ID 列表 }` |

## validateYaml

```typescript
async validateYaml(source: string): Promise<{ ok: true; workflowId: string }>
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `source` | `string` | 文件路径或内联 YAML |

本地 Schema 校验，**不调用 Orchestrator**。失败抛出 `YamlValidationError`。

## loadAndRegister

```typescript
async loadAndRegister(
  yaml: string,
  bindings?: Record<string, { type: 'http'; endpoint: string; headers?: Record<string, string> }>,
): Promise<{ workflowId: string }>
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `yaml` | `string` | Workflow YAML 文本 |
| `bindings` | `UsesBindings` | HTTP 远程 Unit 映射 |

**需要 `baseUrl`**，调用 `POST /workflows/from-yaml`。in-process 请用 [createEngineFromYaml](/reference/yaml-api)。

## startWorkflow

```typescript
async startWorkflow(
  workflowId: string,
  input?: Record<string, unknown>,
  opts?: { sync?: boolean },
): Promise<RunRecord>
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `workflowId` | `string` | — | 工作流 ID |
| `input` | `object` | `{}` | 初始 SharedState |
| `opts.sync` | `boolean` | `false` | 同步等待完成 |

remote → `POST /workflows/:id/runs`；in-process → 本地 Engine。

## getRun

```typescript
async getRun(workflowId: string, runId: string): Promise<RunRecord>
```

查询运行记录。未知 runId 在 in-process 模式抛出 `Error`。

## resume

```typescript
async resume(workflowId: string, runId: string, snapshotId?: string): Promise<RunRecord>
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `snapshotId` | `string` | 可选检查点 ID |

## respondHITL

```typescript
async respondHITL(
  workflowId: string,
  runId: string,
  approved: boolean,
  responder?: string,
): Promise<RunRecord>
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `approved` | `boolean` | — | 是否批准 |
| `responder` | `string` | `'sdk'` | 审批者标识 |

remote → `POST .../hitl`；in-process → `respondToHITL` 后 `resume`。

## searchMemory

```typescript
async searchMemory(
  query: string,
  topK?: number,
): Promise<{ results: { id: string; content: string; score?: number }[] }>
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `query` | `string` | — | 查询文本 |
| `topK` | `number` | `5` | 条数上限 |

**需要 remote 模式**；in-process 返回空 `{ results: [] }`。

## 示例

```typescript
import { createUniFlowClient } from 'uni-flow';

// Remote
const remote = createUniFlowClient({ baseUrl: 'http://127.0.0.1:8787' });
await remote.loadAndRegister(yaml, bindings);
const run = await remote.startWorkflow('cross-lang-greeter', { task: 'world' }, { sync: true });

// In-process
const local = createUniFlowClient();
local.register('demo', () => ({ config: myConfig }));
const localRun = await local.startWorkflow('demo', { task: 'test' }, { sync: true });
```

## 相关

- [Orchestrator HTTP](/reference/http/)
- [Engine](/reference/engine)
- [生成附录说明](/reference/typedoc-appendix) · 查找 `UniFlowClient` / `createUniFlowClient`：[附录正文](/reference/generated/)
