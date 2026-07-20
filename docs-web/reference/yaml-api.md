# YAML API

从 Workflow YAML 构建 Engine 与配置的工具函数，位于 `uni-flow` 的 `yaml` 模块。

## createEngineFromYaml

```typescript
async function createEngineFromYaml(
  source: string,
  options?: CreateEngineFromYamlOptions,
): Promise<WorkflowEngine>
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `source` | `string` | 文件路径（可读）或内联 YAML 字符串 |
| `options` | `CreateEngineFromYamlOptions` | 见下表 |

### CreateEngineFromYamlOptions

| 字段 | 类型 | 说明 |
|------|------|------|
| `registry` | `UnitPluginRegistry` | 自定义 `uses` → 插件映射 |
| `bindings` | `UsesBindings` | HTTP 远程 Unit；与 registry 合并，**registry 优先** |
| `engineOptions` | `WorkflowEngineOptions` | 转发给 `createWorkflowEngine` |

```typescript
const engine = await createEngineFromYaml('workflow.yaml', {
  registry: { 'my.agent': () => createMockAdapter() },
  bindings: { 'remote.agent': { type: 'http', endpoint: 'http://...' } },
});
const result = await engine.run({ task: 'demo' });
```

## validateWorkflowYamlSource

```typescript
function validateWorkflowYamlSource(source: string): WorkflowYamlDocument
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `source` | `string` | YAML 文本（非文件路径） |

对照 Schema：`schemas/uniflow.workflow.schema.json`。失败抛出 **`YamlValidationError`**。

CLI `uniflow validate` 内部使用此函数（先读文件再校验）。

> 符号级中文注解见 [生成附录说明](/reference/typedoc-appendix) → [附录正文](/reference/generated/)（查找 `createEngineFromYaml` / `validateWorkflowYamlSource` / `runWorkflowAsUnit`）。

## 相关函数

| 函数 | 说明 |
|------|------|
| `createEngineFromDocument(doc, options?)` | 已解析文档 → Engine |
| `createWorkflowConfigFromYaml(source, options?)` | → `{ workflowId, config, options? }` |
| `createWorkflowConfigFromDocument(doc, options?)` | 文档 → 配置 |
| `validateWorkflowDocument(doc)` | 校验已解析对象 |
| `loadWorkflowSchema()` | 加载 JSON Schema |
| `resolveSchemaPath()` | 解析 Schema 文件路径 |
| `registryFromBindings(bindings?)` | bindings → 插件注册表 |
| `mergePluginRegistries(...parts)` | 合并多个注册表 |
| `runWorkflowAsUnit(source, input, options?)` | Workflow-as-Unit：YAML → `AgentOutput` |
| `createWorkflowAsUnitHttpHandler(source, options?)` | Node `POST /execute` 监听器工厂 |

## 错误类型

| 类 | 何时抛出 |
|----|----------|
| `YamlValidationError` | Schema 不通过 |
| `YamlLoadError` | 插件解析 / bindings / flow 映射失败 |

## CLI validate

```bash
npx uniflow validate path/to/workflow.yaml
```

仅 Schema 校验，不 resolve 插件、不执行工作流。

## 示例

```typescript
import { createEngineFromYaml, validateWorkflowYamlSource } from 'uni-flow';
import { readFileSync } from 'node:fs';

const yaml = readFileSync('examples/yaml-sequential.yaml', 'utf8');
const doc = validateWorkflowYamlSource(yaml);
console.log('id:', doc.metadata.id);

const engine = await createEngineFromYaml(yaml);
await engine.run({ task: 'test' });
```

## 相关

- [YAML 指南](/guide/yaml)
- [uses 与插件](/guide/uses)
- [Engine](/reference/engine)
- [生成附录说明](/reference/typedoc-appendix) · [附录正文](/reference/generated/)
