# Layer4 组件

## What（是什么）

Layer4 是嵌入 Engine 的**生产横切组件集**，在 Unit 执行前后统一介入：

| 组件 | 职责 |
|------|------|
| **Policy** | 预算、超时、重试、错误决策 |
| **Security** | 鉴权、工具策略、注入防护、HITL |
| **Context** | 记忆 assemble / record |
| **Checkpoint** | 快照 save / load，支撑 resume |
| **Observability** | Span、日志、成本指标 |

它们不是「第五种 ControlFlow」，而是 [执行管线](/architecture/pipeline) 上的钩子。

## Who（谁在用）

- 平台组：配置全局 Policy、Security 角色
- 应用组：按 Unit 设置 `contextPolicy`、`policyOverrides`
- SRE：接入 OTel、Redis Checkpoint（可选）

## Why（为什么需要）

| 若没有 Layer4 | 后果 |
|---------------|------|
| 每 Agent 复制预算逻辑 | Token 统计不一致 |
| 鉴权散落在工具代码 | 遗漏即越权 |
| 无 checkpoint | 长跑工作流不可恢复 |
| 无统一 Context | 多 Unit 记忆碎片化 |

Layer4 把「生产烦恼」从 Prompt 里**抽出来**，变成可测试、可替换的后端。

## How（怎么用）

**默认内存实现（零配置可跑）：**

```typescript
const engine = createWorkflowEngine(config, {
  policyConfig: { budget: { maxTotalTokens: 100_000 } },
  caller: { id: 'user-1', roles: ['operator'] },
});
```

**显式替换后端：**

```typescript
createWorkflowEngine(config, {
  contextManager: myContextManager,
  checkpointStore: myRedisStore,
  observability: myOtelObs,
  security: createFullSecurityGovernance({ /* ... */ }),
});
```

**反事实速查：** 见 [执行管线](/architecture/pipeline) 各阶段「若没有会怎样」。

## 仓库现状

| 组件 | 状态 |
|------|------|
| Policy | ✅ `createPolicyEngine` |
| Security | ✅ 含 HITL 路径 |
| Context | ✅ 内存；向量 🟡 |
| Checkpoint | ✅ 内存；Redis 🟡 |
| Observability | ✅ 基础；OTel 🟡 |

## 相关链接

- [执行管线](/architecture/pipeline)
- [API：Layer4](/reference/layer4)
- [路线图](/architecture/roadmap)

## 若你只记住一件事

**Layer4 是管线的零件盒；缺了可以空转，上了就全家按同一顺序生效。**
