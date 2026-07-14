# Uni-Flow SDK 完全体设计

**日期：** 2026-07-14  
**状态：** 已定稿（方案 2）  
**前置：** [标准库 + YAML 双轨设计](./2026-07-14-uniflow-standard-library-yaml-design.md)（P0 已落地）

---

## 1. 目标与成功标准

### 1.1 要建成什么

把 Uni-Flow 做成 **编排标准体 SDK**（非控制台平台），使各类 Agent 项目可按同一约定接入：

- **编排标准体（A）**：YAML 编排真源 + `uses` 插件 + Schema / validate / AI 规则  
- **跨语言**：Python / Java 与 TypeScript **共用同一份 Workflow YAML 与 JSON Schema**，经 SDK / Sidecar 对接同一执行核  
- **验收**：SDK + **三端轻量 demo** 端到端跑通；测试覆盖契约与失败路径，不挂靠 accounting-tool / 剪辑等业务真仓  

### 1.2 非目标

- 多租户 SaaS、可视化编排控制台  
- 在 Python / Java 重写全量 Engine / ControlFlow  
- 本期改写 accounting-tool 或 AI 剪辑产品仓  
- 完整多模态 Artifact / 媒资管线（P3 只留扩展口）  
- 强制完成 npm / PyPI / Maven Central 正式发布（仓内可依赖即可）

### 1.3 Definition of Done（本期）

1. 同一 YAML 经 TS / Python / Java `validate` 均通过（共用 Schema 与 fixture 矩阵）。  
2. Python / Java 经 Orchestrator 各成功 `run` 一次，返回非空 Unit 输出。  
3. TS 进程内 `createEngineFromYaml` 回归保持绿色。  
4. 文档含跨语言接入、`uses` 决策图、远程 Unit JSON 契约、Registry 内存态说明。  
5. P3：`artifacts` 预留键文档化；引擎不解释该字段。  
6. 分层测试（见 §6）全部通过或按约定在 CI 可跑。

### 1.4 与 accounting-tool 的关系

| 问题 | 结论 |
|------|------|
| 本期完成后能否 **按标准方式接入**？ | **能。** accounting-tool 为 TS，可用 Unit Wrapper + `createEngineFromYaml`（不必等 Py/Java）。 |
| 本期是否 **自动接好** accounting-tool？ | **否。** 接线（YAML、Adapter、开关）在业务仓另做。 |
| 是否必须等本期全做完才能开始试接？ | **否。** P0 进程内 Loader 已够做验证级接入；本期强化 from-yaml / 契约 / 文档 / 跨语言闭环。 |

---

## 2. 架构（方案 2：单一执行核 + 多语言客户端）

```
真源: schemas/uniflow.workflow.schema.json + *.workflow.yaml
                │
                ▼ validate（各语言 SDK 本地）
┌──────────┐  ┌──────────┐  ┌──────────┐
│ TS SDK   │  │ Py SDK   │  │ Java SDK │
│ 进程内或 │  │ HTTP +   │  │ HTTP +   │
│ HTTP     │  │ YAML API │  │ YAML API │
└────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │
     └────────────►│◄────────────┘
                   ▼
         Orchestrator (TS)
         Engine + Layer4 + Registry
                   │
         builtin.* / HTTP Unit / MCP
```

**原则**

1. 编排语义只有一份；执行核是现有 TS Engine（含 Orchestrator HTTP）。  
2. Py/Java **不**重写 ControlFlow；职责：校验 YAML → 注册到 Orchestrator → run / resume / HITL。  
3. TS 双轨：库内与单测继续进程内 YAML；跨语言验收统一走 Orchestrator。  
4. 业务接入 = YAML + `uses`（进程内 Adapter 或 HTTP Agent）+ 对应语言 SDK。

---

## 3. 契约与 API

### 3.1 语言无关契约

| 工件 | 作用 |
|------|------|
| `schemas/uniflow.workflow.schema.json` | 三端校验真源（已有） |
| Workflow YAML | 拓扑 / policy / `uses` |
| Orchestrator HTTP | 跨语言执行面 |
| 远程 Unit JSON | 对齐 `HttpAdapter`：`POST` body 含 input → `AgentOutput` |

### 3.2 Orchestrator 新增能力

现状：`WorkflowRegistry` 仅支持进程内 `register(factory)`，HTTP 不能直接吃 YAML。

新增：

1. **`POST /workflows/from-yaml`**  
   Body：`{ yaml: string, bindings?: Record<string, { type: 'http', endpoint: string }> }`  
   行为：validate → 按 bindings / builtin 解析 `uses` → `createEngineFromYaml` → 按 `metadata.id` 注册。  
2. **缺 binding 且非 builtin → 注册失败**（与 Loader fail-fast 一致）。  
3. 保留现有 runs / resume / HITL / health。

### 3.3 SDK 统一表面

```text
validate(source) -> ok | errors
load_and_register(source, bindings?, base_url?) -> workflow_id
run(workflow_id, input, sync?) -> run_result
resume / hitl / get_run
```

- **TypeScript**：另保留进程内 `createEngineFromYaml`。  
- **Python / Java**：Schema 校验（如 `jsonschema` / 等价 Java 库）+ 扩展现有 HTTP Client。  
- Sidecar（Checkpoint / Memory）保持可选，与 YAML 编排正交。

### 3.4 `uses` 约定（异构 demo）

- 跨语言 Unit 优先：**bindings → `builtin.http`**（或注册名映射到 HTTP）。  
- 本期保证：`builtin.mock`、`builtin.http`。  
- `builtin.llm-router` / 完整 MCP 编排：文档列为后续，避免假完整。

### 3.5 P3 口子（不实现语义）

- `AgentOutput.metadata` / SharedState 预留键 **`artifacts`**：数组元素建议 `{ id, uri?, mimeType?, label? }`。  
- SDK **透传、不解释**；调用方不得依赖引擎处理该字段。  
- Schema：未知扩展字段策略以「不破坏 v1 校验」为准（`config` 保持 object；文档说明 artifacts 为约定键而非本期必填）。

### 3.6 版本与错误

- `apiVersion` 仅 `uniflow/v1`；否则拒绝。  
- 错误含可读 message + schema path（CLI / SDK 风格对齐）。

### 3.7 Registry 内存态（使用者须知）

**会丢：** Orchestrator **进程内存**中的已注册工作流；进程退出后需再次 `from-yaml` / `register`。  

**不会丢：** 磁盘上的 YAML / Schema / 业务代码；已配置的外部 Checkpoint 存储中的 run 快照；业务库数据。  

开发与 demo 的预期行为；启动扫目录或注册表持久化属后续优化。

---

## 4. 三端轻量 demo

### 4.1 共享 YAML

`examples/cross-lang/greeter.workflow.yaml`：单 Unit + `sequential`，`uses: demo.greeter`（经 bindings 指向本机 HTTP Unit）。

### 4.2 目录

| Demo | 路径 | 行为 |
|------|------|------|
| TS | `examples/cross-lang/ts/` | 起 Orchestrator；注册 YAML；run |
| Python | `examples/cross-lang/python/` | 最小 HTTP greeter + SDK validate/register/run |
| Java | `examples/cross-lang/java/` | 同上（优先 JDK HttpServer） |

README **三步**：起核 → 起 Unit → 跑 SDK。提供脚本降低「先懂 Node 才能跑 Py」的门槛。

---

## 5. 落地分期

| 阶段 | 内容 |
|------|------|
| **Done** | Engine / Layer4 / Orchestrator 基础 / P0 YAML |
| **C1** | `POST /workflows/from-yaml` + bindings；TS 集成测试 |
| **C2** | Py/Java validate + register + run；错误形态对齐 |
| **C3** | 三端轻量 demo + 启动脚本 |
| **C4** | 跨语言文档、`uses` 决策图、Unit 契约、artifacts 口子、路线图修订 |
| **以后** | 业务真仓 Wrapper、Artifact 语义、包仓库发布、Registry 持久化、更强 builtin |

原路线图映射：P1 样板精神并入 C3；P2 ≈ C2；P3 = 仅口子。

---

## 6. 测试策略（必须全面）

| 层 | 覆盖 |
|----|------|
| Schema 矩阵 | valid / 错误 version / 缺 units / 非法 flow / router 缺 routes 等；三端 validate 一致 |
| Loader / from-yaml | 成功、缺 binding、builtin.mock/http、policy 透传 |
| Orchestrator HTTP | health、from-yaml、run sync/async、错误 JSON；resume/HITL 冒烟 |
| 远程 Unit 契约 | HttpAdapter 黄金请求/响应 fixture |
| E2E 三端 | 同 YAML：校验 → 注册 → run → 断言输出；核未起时明确连接错误 |
| 回归 | 现有 TS 测试全绿 |

---

## 7. 使用者视角：缺陷与本期优化

| # | 现状体感 | 本期 |
|---|----------|------|
| 1 | 无法「交一份 YAML」给 Orchestrator 就跑 | **C1 必修** |
| 2 | Py/Java 无 validate/注册 YAML | **C2 必修** |
| 3 | 起 Orchestrator 门槛高 | **C3 脚本 + 三步文档** |
| 4 | Adapter / HTTP / Sidecar 易混 | **C4 决策图** |
| 5 | 远程 Unit JSON 非一等公民 | **契约文档 + 黄金 fixture** |
| 6 | YAML v1 无 composite | **文档说明**：高级拓扑用代码 API |
| 7 | Registry 重启丢注册 | **文档说明**（§3.7） |
| 8 | 未上正式包仓库 | **不阻塞**；仓内依赖说明 |
| 9 | builtin 不齐 | **本期仅保证 mock+http** |
| 10 | run 结果字段不直观 | **文档保证** runId / completedUnits / state 摘要 |
| 11 | P3 易被误当成已实现 | **留口 + 标明未实现** |
| 12 | 误以为必须先接真业务仓 | **DoD = SDK + 三端 demo** |

---

## 8. 风险与缓解

| 风险 | 缓解 |
|------|------|
| 多语言 Schema 行为漂移 | 同一 JSON Schema 文件 + 共用 fixture |
| Orchestrator 隐式单点 | 文档写清；TS 保留进程内路径 |
| HTTP Unit 契约漂移 | 固定 JSON + 黄金测试 |
| 范围回胀为平台/真仓 | DoD 绑定 §1.3 |
| artifacts 被误用 | 文档禁止依赖引擎处理 |

---

## 9. 总结

本期 Uni-Flow **SDK 完全体** = 编排标准体 + 单一 TS 执行核 + 多语言 YAML/SDK 客户端 + 全面契约测试 + 三端小 demo；P3 只留口子；不做平台、不改业务真仓。完成后各类 Agent 项目（含 accounting-tool）**具备**标准接入能力；具体接线在业务侧按 Wrapper 模式落地。
