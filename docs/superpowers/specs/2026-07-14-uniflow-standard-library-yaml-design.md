# Uni-Flow 标准库设计：YAML 编排面 + 代码插件面

**日期：** 2026-07-14  
**状态：** 已定方向（方案 3）  
**目标读者：** 人类开发者与 AI 编程工具（Cursor / Codex / Claude Code）

---

## 1. 问题与目标

### 1.1 要解决什么

将 Uni-Flow 做成 **可依赖的标准运行时库**（类 MCP SDK）：

1. 业务项目通过依赖引擎跑起来（不是只读文档）  
2. 用 **YAML** 统一描述工作流拓扑与横切参数，新旧项目可快速上手  
3. **人与 AI** 都能遵循同一套约定写编排，避免各项目发明第二套排班逻辑  

### 1.2 非目标（本设计不做）

- 不替代领域业务（记账 Parse、剪辑 FFmpeg、企业权限模型）  
- 不强制第一期删除各项目自研 Kernel（允许 Wrapper 渐进）  
- 不做多租户 SaaS 控制台  

### 1.3 成功标准

| 角色 | 成功表现 |
|------|----------|
| 新项目 | 拷贝模板 YAML + 注册 1～N 个 `uses` 插件即可跑通 |
| 旧项目 | 业务代码基本不动，外层 YAML 引用现有 Agent/Executor |
| 人类 | 看 YAML 能读懂拓扑与预算/超时 |
| AI 工具 | 优先改 YAML；新能力走插件；校验 Schema 通过 |

---

## 2. 双轨架构（方案 3）

```
┌─────────────────────────────────────────────────────────┐
│  uniflow.workflow.yaml          （编排真源 / 配置面）      │
│  units · flow · policy · bindings · hitl                 │
└───────────────────────────┬─────────────────────────────┘
                            │ load + validate (JSON Schema)
                            ▼
┌─────────────────────────────────────────────────────────┐
│  @uni-flow/engine（标准库）                               │
│  WorkflowEngine · ControlFlow · Layer4 · Orchestrator    │
└───────────────────────────┬─────────────────────────────┘
                            │ resolve uses:
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
   builtin.*          project plugins      remote
   http/mcp/mock      accounting.record    MCP Server
                      editing.transcribe
```

**原则：**

- **能声明的进 YAML**（拓扑、路由表、超时、预算、HITL 开关）  
- **领域智能进代码插件**（由 `uses: namespace.name` 引用）  
- **禁止**在业务里手写与 YAML 平行的第二套 ControlFlow 拓扑（AI rules 约束）

---

## 3. YAML 职责边界

### 3.1 MUST 进入 YAML

- `apiVersion` / `kind` / `metadata.id`  
- `spec.units[]`：id、uses、可选 contextPolicy / policyOverrides  
- `spec.flow`：sequential | loop | parallel | router | dag | delegation | composite  
- `spec.policy`：retry / timeout / budget / concurrency（工作流级默认）  
- 入口与路由映射、DAG 依赖边  

### 3.2 MUST NOT 进入 YAML

- Prompt 全文、SQL、领域规则表  
- 具体 LLM vendor 密钥  
- 业务校验细节（如「晚餐必须挂叶子类目」）  

### 3.3 示意语法（v1）

```yaml
apiVersion: uniflow/v1
kind: Workflow
metadata:
  id: accounting-chat
  description: 记账助手顶层编排
spec:
  entry: intent-router
  policy:
    retry: { maxAttempts: 3, backoff: exponential, baseMs: 500 }
    timeout: { unitMs: 120000, workflowMs: 600000 }
    budget: { maxTokens: 80000, maxCost: 2 }
  units:
    - id: intent-router
      uses: builtin.llm-router
      config:
        routes: [record, query, general]
    - id: record
      uses: accounting.record
    - id: query
      uses: accounting.query
    - id: general
      uses: accounting.chat
      contextPolicy:
        vectorMemory: { enabled: true, topK: 5 }
  flow:
    type: router
    routerUnit: intent-router
    routes:
      record: record
      query: query
      general: general
```

### 3.4 加载 API（目标形态）

```typescript
import { createEngineFromYaml } from 'uni-flow';

const engine = await createEngineFromYaml('./uniflow.workflow.yaml', {
  registry: {
    'accounting.record': recordAdapter,
    'accounting.query': queryAdapter,
    'accounting.chat': chatAgentAdapter,
  },
});
await engine.run({ task: userMessage, userId, sessionId });
```

---

## 4. 插件与内置能力

### 4.1 Unit 插件契约

每个 `uses` 最终解析为 `RuntimeAdapter`（或可构造 WorkflowUnit 的工厂）：

```typescript
type UnitPlugin = {
  name: string; // accounting.record
  create(config?: Record<string, unknown>): RuntimeAdapter | WorkflowUnit;
};
```

### 4.2 内置 uses（引擎提供）

| uses | 作用 |
|------|------|
| `builtin.mock` | 测试 |
| `builtin.http` | HTTP Agent 端点 |
| `builtin.mcp` | MCP Server 工具型 Agent |
| `builtin.llm-router` | 可选：LLM/规则路由（产出 route key） |

### 4.3 与现有代码 API 关系

- **YAML 路径**：主编排入口（新项目默认）  
- **代码路径**：`createWorkflowEngine` 仍保留，供测试、高级组合、YAML 尚未覆盖的 Composite 边角  

二者共用同一套 Engine / Layer4，避免双实现。

---

## 5. 人与 AI 双遵守

### 5.1 机器可校验

- `schemas/uniflow.workflow.schema.json`（JSON Schema）  
- CLI：`npx uniflow validate path/to.yaml`  

### 5.2 AI 编程工具约束（建议工件）

仓库提供：

- `.cursor/rules/uni-flow.mdc`（或 `AGENTS.md` 段落）核心条文：  
  1. 编排拓扑只改 YAML  
  2. 新领域能力先加 `uses` 插件并注册  
  3. 禁止用 for/while 手写多 Agent 调度代替 ControlFlow/YAML  
  4. 改完跑 validate  
- `examples/templates/`：qa / rag / vertical-transaction / media-pipeline 四类模板  

### 5.3 人类文档

README：理念、原理、现有能力、YAML 目标形态、路线图（本设计落地后更新）。

---

## 6. 渐进落地路线

| 阶段 | 交付 | 验证项目 |
|------|------|----------|
| **Now（已有）** | TS Engine、ControlFlow、Layer4、Orchestrator、SDK、Sidecar 设计 | Uni-Flow 单仓 |
| **P0** | Workflow YAML Schema + Loader + validate CLI + Cursor rule | Uni-Flow 示例 YAML |
| **P1** | 模板包 + 文档；记账项目外层 Wrapper YAML（方案 B） | accounting-tool |
| **P2** | 多语言读取同一 YAML（Python/Java SDK load） | 多模态 / RAG 样板 |
| **P3** | Artifact/多模态中间产物类型；更强 builtin 路由 | 多模态 |

---

## 7. 风险与缓解

| 风险 | 缓解 |
|------|------|
| YAML 表达力不足 | 保留代码 API；Composite 先进代码后回灌 YAML |
| AI 仍手写第二套编排 | Schema + rules + validate 门禁；PR 检查 |
| 与业务 Kernel 双调度 | 文档明确：YAML 只做顶层，Kernel 只做 Unit 内核 |
| 配置漂移 | apiVersion 版本协商；破坏性变更升 major |

---

## 8. 开放细节（实现阶段再定）

- Router 的 `routeExtractor` 用 YAML 表达式还是仅靠 router Unit 写 SharedState  
- `config` 透传插件的 JSON Schema 是否 per-plugin 扩展  
- 包名最终用 `uni-flow` 还是 `@uni-flow/engine`  

---

## 9. 总结

方案 3 将 Uni-Flow 定义为：**依赖即可运行的标准库 + YAML 编排真源 + 插件扩展 + 人/AI 校验约定**。  
现有四层引擎是底座；下一步关键增量是 **YAML Schema/Loader/校验与 AI rules**，而不是重做编排语义。
