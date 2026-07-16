# YAML Loader

## What（是什么）

YAML Loader 将 Workflow YAML（`apiVersion: uniflow/v1`）解析、校验、实例化为可运行的 Engine：

```typescript
createEngineFromYaml(source: string | path, options?: {
  registry?: Record<string, UnitFactory>;
  bindings?: HttpBindings;
}): Promise<WorkflowEngine>;
```

`source` 可以是文件路径或 YAML 字符串；校验依据 `schemas/uniflow.workflow.schema.json`。

## Who（谁在用）

- 人类与 AI 编辑拓扑的配置作者
- CI：`npx uniflow validate <path>`
- Orchestrator：`POST /workflows/from-yaml`

## Why（为什么需要）

| 若没有 Loader + Schema | 后果 |
|------------------------|------|
| 拓扑只在代码里 | 人与 Agent 无法共用可 diff 真源 |
| 无 validate | 坏图到运行时才发现 |
| `uses` 无法声明 | 领域能力被迫写进引擎 |

Loader 是 **YAML-first 纪律** 的 enforcement 点，见 `AGENTS.md`。

## How（怎么用）

**校验：**

```bash
npx uniflow validate examples/templates/sequential-mock.yaml
```

**加载：**

```typescript
import { createEngineFromYaml } from 'uni-flow';

const engine = await createEngineFromYaml('./workflow.yaml', {
  registry: {
    'builtin.mock': () => createMockUnit(/* ... */),
    'myapp.classifier': myClassifierFactory,
  },
});
```

**`flow` 映射：** `type: router | sequential | parallel | ...` → 对应 ControlFlow 类。

**模板：** `examples/templates/` 可复制修改。

## 仓库现状

| 项 | 状态 |
|----|------|
| Schema | ✅ `schemas/uniflow.workflow.schema.json` |
| Loader | ✅ `src/yaml/loader.ts` |
| CLI validate | ✅ `dist/cli/uniflow.js` |
| Composite 全表达 | 🟡 复杂嵌套用代码 API |
| HTTP bindings | ✅ Orchestrator 侧 |

## 相关链接

- [指南：YAML 与 validate](/guide/yaml)
- [ControlFlow](/architecture/modules/control-flow)
- [API：YAML API](/reference/yaml-api)

## 若你只记住一件事

**改拓扑先改 YAML，改完必 validate——Loader 是契约守门人。**
