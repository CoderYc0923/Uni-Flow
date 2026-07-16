# SDK 与 CLI

## What（是什么）

Uni-Flow 提供多层开发者入口：

| 入口 | 用途 |
|------|------|
| **TypeScript 库** | `createWorkflowEngine`、`createEngineFromYaml`、类型导出 |
| **CLI** | `uniflow validate`、未来扩展 run 等 |
| **Python SDK** | `sdk/python` — validate、HTTP 调 Orchestrator |
| **Java SDK** | `sdk/java` — 同上 |
| **TS HTTP Client** | `src/sdk/client.ts` 封装 Orchestrator |

## Who（谁在用）

- Node 服务内嵌 Engine 的 TS 团队
- 非 TS 业务服务（Py/Java 调 HTTP）
- CI 与编码 Agent（`validate` 守门）
- 文档读者（快速开始 Mock）

## Why（为什么需要）

| 若没有统一 SDK/CLI 面 | 后果 |
|------------------------|------|
| 每人手写 fetch | 字段名不一致（`runId` vs `run_id`） |
| 无 validate 命令 | 坏 YAML 进仓库 |
| 跨语言各抄契约 | 与 `remote-unit-http-contract` 漂移 |

SDK 完整面的目标是：**结构校验 + 远程编排 + 统一结果字段**。

## How（怎么用）

**安装与构建：**

```bash
npm install
npm run build
npm test
```

**CLI 校验：**

```bash
npx uniflow validate path/to/workflow.yaml
```

**TS 进程内：**

```typescript
import { createEngineFromYaml, createMockAdapter } from 'uni-flow';
```

**Python（示意）：**

```python
# sdk/python — validate 与 start_workflow 见包内 README
```

**跨语言 demo：** `examples/cross-lang/` — 起核 → 起 Unit → SDK 跑通。

**运行结果字段（应对用户暴露）：** `runId`、`status`、`result.completedUnits`、`result.state`（如 `output.<unitId>`）。

## 仓库现状

| 项 | 状态 |
|----|------|
| TS 核心导出 | ✅ |
| CLI validate | ✅ |
| Python SDK | ✅ 结构 + HTTP |
| Java SDK | ✅ 结构 + HTTP |
| CLI run（本地一键跑） | 🟡 以代码示例为主 |
| 发布 npm 包命名 | 🟡 以仓库 `package.json` 为准 |

## 相关链接

- [快速开始](/guide/quickstart)
- [YAML 指南](/guide/yaml)
- [API 总览](/reference/)
- [路线图](/architecture/roadmap)

## 若你只记住一件事

**TS 写图 + validate；其他语言调 Orchestrator——字段名跟 SDK，别自己猜。**
