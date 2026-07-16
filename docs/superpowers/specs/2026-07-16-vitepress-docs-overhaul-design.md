# Uni-Flow 文档体系重做（VitePress）设计

日期：2026-07-16  
状态：已与产品方确认（brainstorming）

## 1. Context

现有 MkDocs `docs-site/` 以记账故事开篇、概念碎页为主；API/HTTP/SDK 仅有速查表，达不到业界手册级可读性。作者与用户对「Who/Why/How、与 LangGraph 关系、模式变动抗性、两层模型」仍难形成统一、可说服的心智。

约束与决策（已确认）：

- **一期做完**：叙事 + 原理重梳 + 全量公开 API/HTTP/SDK 手册 + README + 设计长文入站
- **VitePress** 替代 MkDocs，部署 **GitHub Pages（Actions）**
- **高可读手写精品页** + **可定期再跑的 TypeDoc 附录**（实现与更新由维护者/Agent 执行）
- 视觉：**VitePress 默认 + 轻品牌色**
- **记账故事仅出现在示例**，不进原理章主叙事
- 根目录 `Agent统一工作流模式设计.md` **迁入站点**作附录

## 2. Goals / Non-Goals

**Goals**

1. 讲清产品诉求与 **Who / Why / How**，以及为何不绑死市面成熟框架（共性与区别）
2. 每个核心模块用同一套 **模块 3W**（Who / Why / How + 没有它会怎样 + 仓库现状）
3. 整合「Agent 模式大变」时的**稳定层 vs 易变层**与拓展抗性
4. 对外每个公开方法/API/HTTP 路由/SDK 表面：定义、功能、参数、返回、错误、示例
5. 原理与规划用图（Mermaid）论证两层模型、管线、Layer4、路线图
6. 全篇通俗、逻辑通顺；README 为门户；设计长文入 `docs-web`

**Non-Goals**

- 不改 Engine / 运行时行为
- 不实现生产级记账业务插件
- 不自研重量级文档主题；仅用 VitePress 默认主题 + 轻品牌色
- 不把 OpenSpec changes 全文镜像进站点

## 3. Information architecture

站点目录：`docs-web/`。

```
首页                         Who/Why 一句话 + CTA

为什么选 Uni-Flow
  ├ 诉求与 3W
  ├ 与 LangGraph / 同类：共性与区别
  └ 模式变动时的可扩展性（抗性）

原理与规划
  ├ 问题 → 约束 → 两层模型（总览图）
  ├ 执行管线与 Layer4（「若没有会怎样」）
  ├ 模块地图 → 各模块 3W
  ├ 路线图
  └ 设计长文附录（迁入）

指南
  ├ 安装与快速开始
  ├ YAML 与 validate
  ├ uses / 进程内 vs 远程
  └ 跨语言概览

示例
  ├ 索引
  ├ 记账意图分流（Router）← 故事仅此
  └ Sequential / 跨语言 …

API 参考
  ├ 总览
  ├ Orchestrator HTTP（逐路由手册）
  ├ TypeScript SDK
  ├ Python / Java SDK
  ├ Engine · YAML · ControlFlow · Adapters · Layer4（手写）
  └ 生成附录（TypeDoc）

贡献 / Agent 约定
```

### 3.1 原理与规划写法（说服力）

固定论证链：**问题 → 约束 → 结构 → 证据 → 边界**。

1. 多能力如何编排且不绑框架、不手写排班  
2. 设计原则：编排/领域分离；Unit 黑盒；ControlFlow 可声明；横切统一管线  
3. 两层模型图：外层 ControlFlow，内层 Unit（可 ReAct）；明确顶层不是 Think/Execute/Observe  
4. 模块 3W 地图  
5. 管线顺序与代码一致，逐步「解决什么 / 不挂会怎样 / 路径」  
6. Layer4 用反事实论证，而非功能堆砌  
7. 路线图与抗性同一套标准（改图/插件，不改契约）  
8. 设计长文为附录，文首指向本节  

自测：读者能否口述与 LangGraph 分工、模式变了动哪一层、Layer4 为何存在。

## 4. Content models

### 4.1 产品 3W

| 维度 | 内容要点 |
|------|----------|
| Who | 需要多 Agent/多能力编排；要 YAML 真源或跨语言；箱内可能是 LC/LangGraph/自研 |
| Why | 解耦编排与领域；统一横切；Schema/validate 给人+AI 共用 |
| How | YAML 拓扑 → uses 插件 → Engine；远程 Orchestrator + HTTP Unit |

### 4.2 框架对比

至少对比 LangGraph；简述「纯 LangChain / 手写 for」。结论：**不替代 LangGraph，外层标准；箱内可 Unit Wrapper。**

### 4.3 抗模式变动

| 稳定层 | 易变层 |
|--------|--------|
| Unit 契约、ControlFlow 语义、管线顺序 | Unit 内推理、模型、工具 |
| YAML Schema、validate | 拓扑与路由规则 |
| HTTP/SDK 契约 | 业务插件实现 |

误读纠正：Think/Execute/Observe = 箱内一种循环，不是顶层架构。

### 4.4 模块 3W 模板

每模块：What → Who → Why（没有它会怎样）→ How（最小例 + API 链）→ 仓库现状（✅/🟡/⬜）。

覆盖：WorkflowUnit、RuntimeAdapter、ControlFlow、SharedState、MessageBus、Engine、Policy、Security、Context、Checkpoint、Observability、YAML Loader、Orchestrator、TS/Py/Java SDK、CLI validate。

### 4.5 API 页模板

每符号/路由：定义、功能、签名或 Method+Path、参数表、返回/响应、错误、可复制示例、相关链接。

- **精品层（手写）：** Engine、YAML、Orchestrator 全路由、UniFlowClient、Py/Java 主表面  
- **附录层（生成）：** `npm run docs:api` → TypeDoc → `docs-web/reference/generated/`  
- HTTP 真源对账：`src/orchestrator/server.ts`、`docs/remote-unit-http-contract.md`

## 5. Engineering decisions

### D1: VitePress in `docs-web/`

替代 MkDocs。`base: /Uni-Flow/`。主题默认 + 轻品牌色。Mermaid 用于原理图。

### D2: Scripts

- `docs:dev` — vitepress dev  
- `docs:api` — typedoc 生成附录  
- `docs:build` — docs:api && vitepress build  

### D3: GitHub Pages

Node CI：`docs:build` → `actions/upload-pages-artifact` → `actions/deploy-pages`。Pages Source = GitHub Actions。废弃 MkDocs `site/` / peaceiris 路径。

### D4: Repo file roles

| 工件 | 角色 |
|------|------|
| `docs-web/**` | 人读真源 |
| `README.md` | 短门户 + 外链 |
| `AGENTS.md` | 硬规矩 + 链站点原理 |
| 设计长文 | 迁入 `docs-web`；根目录 stub 或改链 |
| `docs/remote-unit-http-contract.md` | 契约真源；站点摘要+链 |

### D5: MkDocs retirement

删除主路径依赖（`mkdocs.yml`、`requirements-docs.txt` 主用、旧 `docs-site` 内容迁移后归档或删除）。避免双站漂移。

## 6. Migration plan

1. VitePress 脚手架 + nav/sidebar + Pages workflow  
2. Why + 原理重梳（模型/管线/Layer4/模块 3W）  
3. 指南 + 示例（记账仅示例）  
4. API 精品 + TypeDoc 附录与脚本  
5. 设计长文迁入；README/AGENTS 更新；退役 MkDocs  
6. 验收：`docs:build`、抽查主路径与 HTTP/SDK 页、`npm test`

回滚：git revert 文档/CI 提交；运行时无耦合。

## 7. Risks

| 风险 | 缓解 |
|------|------|
| API 手写与代码漂移 | TypeDoc 附录 + 定期 `docs:api`；HTTP 与 server.ts 对账清单 |
| 一期体量大 | 按迁移步骤顺序交付；精品层优先覆盖公开面，附录兜底全导出 |
| VitePress base path 错 | 文档与 CI 固定 `/Uni-Flow/`；本地 preview 说明 |
| 双站残留 | 明确退役 MkDocs，README 只链 VitePress |

## 8. Open questions (resolved)

| 问题 | 决议 |
|------|------|
| 交付节奏 | 一期全做 |
| 文档栈 | VitePress + GH Pages Actions |
| API 生产 | 手写精品 + TypeDoc 附录（可再跑） |
| 视觉 | 默认 + 轻品牌色 |
| 记账 | 仅示例 |
| 设计长文 | 入站附录 |

## 9. Success criteria

- 读完 Why + 原理：能说清诉求、两层模型、与 LangGraph 关系、模式变了动哪一层  
- API/HTTP/SDK：能查到定义、参数、示例  
- `npm run docs:build` 成功；Pages 可部署；`npm test` 不回归  

## 10. Next step

用户审阅本文件通过后，使用 writing-plans 产出实现计划，再 `/opsx:propose` 或直接按计划实施（由用户指定）。
