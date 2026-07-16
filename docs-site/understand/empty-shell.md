# 是不是空壳？

诚实对照：左边是设计意图，右边是仓库里**现在**的状态。

图例：✅ 可用 · 🟡 演示级 / 需你自备领域实现 · ⬜ 约定或预留

| 设计理由（解决什么） | 仓库现状 |
|----------------------|----------|
| 多 Unit 统一调度，禁止各项目手写第二套排班 | ✅ Engine + 七种 ControlFlow（`src/core`） |
| 拓扑可声明、可校验，人与 AI 共用 | ✅ YAML Schema / Loader / `uniflow validate`；模板在 `examples/templates/` |
| 领域智能可插拔（记账、闲聊……） | 🟡 `uses` + registry/bindings；**真实记账逻辑要业务方实现**；仓内用 `builtin.mock` 演示分流 |
| 生产横切：预算、安全、记忆、断点 | ✅ 内存实现齐全；Redis/OTel 等 🟡 可选依赖，需显式接入 |
| 跨语言同一套 YAML | 🟡 Orchestrator + HTTP Unit + Py/Java SDK demo（`examples/cross-lang/`） |
| 制品 / 媒体管线 | ⬜ `artifacts` 仅透传口子，引擎不处理 |

## 记账场景怎么读这张表

- **不是壳：** 你能用 YAML 画出 Router，用 Mock 跑通「判意图 → 走 record 或 general」；validate 能拦住坏拓扑。  
- **仍要你补：** 真正的记账解析、写库、闲聊模型——做成 Adapter 挂上 `uses`，或 HTTP Unit。  

## 若你只记住一件事

**编排与校验是实的；业务插件是你的。** 别指望 `npm install uni-flow` 自带一套完整记账产品。

动手：[最小可跑（Mock）](../hands-on/mock-minimal.md)
