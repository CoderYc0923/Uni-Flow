# Agent 统一工作流模式设计

> **读者导读（请先看这里）**  
> 人读入门、记账场景、「是不是空壳」请先走文档站：[`docs-site/understand/`](./docs-site/understand/what-it-solves.md)（本地 `mkdocs serve`）。  
> **本文是附录**：统一公式推导、模式映射与接口草图，不是 Getting Started。对外叙事以文档站为准。

> 基于 pi-agent-core 的 Agent Loop + 事件驱动 + Steering/FollowUp 机制，抽象出一套能够逻辑自洽地涵盖 ReAct、Plan-Execute、Multi-Agent、Router 等所有主流 Agent 设计模式的统一工作流模型。

---

## 0. 业务锚点：记账意图分流（与文档站主故事对齐）

用户一句话进来——「午饭 32」或「今天天气怎么样」：

```text
用户话 → Router Unit（判意图）
            ├ record → 记账 Unit
            └ general → 闲聊 Unit
```

| 模式视角 | 工作流单元 | 控制流 |
|----------|------------|--------|
| Router（记账主故事） | Router + record + general | 条件分支分发 |

可运行 Mock YAML：`examples/accounting-router.yaml`。  
下文的「代码审查」仍可作为全混合模式副例；**入门请优先对照记账 Router。**

---

## 目录

0. [业务锚点：记账意图分流](#0-业务锚点记账意图分流与文档站主故事对齐)
1. [核心洞察](#1-核心洞察)
2. [三层抽象模型](#2-三层抽象模型)
3. [第一层：WorkflowUnit —— 原子 Agent 单元](#3-第一层workflowunit--原子-agent-单元)
4. [第二层：ControlFlow —— 编排策略](#4-第二层controlflow--编排策略)
5. [第三层：MessageBus + SharedState —— 通信与状态](#5-第三层messagebus--sharedstate--通信与状态)
6. [pi-agent-core 三大机制的映射](#6-pi-agent-core-三大机制的映射)
7. [模式映射表：所有模式的统一表达](#7-模式映射表所有模式的统一表达)
8. [混合模式的自洽性证明](#8-混合模式的自洽性证明)
9. [TypeScript 接口定义](#9-typescript-接口定义)
10. [实战：代码审查工作流（全混合模式）](#10-实战代码审查工作流全混合模式)
11. [总结公式](#11-总结公式)

---

## 1. 核心洞察

通过深入分析 pi-agent-core 和所有主流 Agent 设计模式，我们发现：

> **所有 Agent 设计模式本质上都是"工作流单元 + 控制流"的不同组合。**

| 模式 | 工作流单元 | 控制流 |
|------|-----------|--------|
| ReAct | 单个 Agent Loop | 自循环（直到终止条件） |
| Plan-Execute | Planner + Executor(s) | DAG 依赖编排 |
| Multi-Agent（层级） | Orchestrator + Specialists | 委派（Delegation） |
| Multi-Agent（对等） | N 个对等 Agent | 并行 + 广播 |
| Router | Router + Handlers | 条件分支分发 |
| Reflexion | Actor + Evaluator | 反馈循环 |

**统一公式：**

```
Agent 工作流 = AgentLoop ⊗ (Steering | FollowUp) ⊗ ControlFlow
```

- **AgentLoop**：pi-agent-core 的默认执行引擎，是所有模式的不可再分原子
- **Steering / FollowUp**：pi-agent-core 唯一的运行时消息注入通道
- **ControlFlow**：决定注入什么、何时注入的编排策略

三者正交组合，覆盖所有已知 Agent 设计模式，且任意混合自洽。

---

## 2. 三层抽象模型

```
┌─────────────────────────────────────────────────────────────┐
│                    Workflow（顶层编排）                       │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              ControlFlow（控制流层）                    │  │
│  │                                                       │  │
│  │  ┌──────────┐   ┌──────────┐   ┌──────────┐          │  │
│  │  │  Unit A  │   │  Unit B  │   │  Unit C  │   ...    │  │
│  │  │ (Agent)  │   │ (Agent)  │   │ (Agent)  │          │  │
│  │  └────┬─────┘   └────┬─────┘   └────┬─────┘          │  │
│  │       │               │               │               │  │
│  │  ─────┴───────────────┴───────────────┴────           │  │
│  │              MessageBus（消息总线）                    │  │
│  │  ────────────────────────────────────────             │  │
│  │              SharedState（共享状态）                   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

| 层 | 职责 | 类比 | pi-agent-core 对应 |
|----|------|------|-------------------|
| **WorkflowUnit** | 封装完整 Agent 执行循环 | 函数 | `Agent` 类实例 |
| **ControlFlow** | 决定单元间调度关系 | if/for/while | **外层实现**（扩展点） |
| **MessageBus + State** | 单元间通信与共享 | 变量作用域 + 消息队列 | `steer()` / `followUp()` + 事件系统 |

---

## 3. 第一层：WorkflowUnit —— 原子 Agent 单元

### 3.1 定义

WorkflowUnit 是统一模型的最小可组合原子。它封装了：

```typescript
interface WorkflowUnit {
  id: string;                          // 唯一标识
  agent: AgentConfig;                  // Agent 配置（模型、提示词、工具）
  terminationPolicy: TerminationPolicy; // 执行边界
  inputAdapter: (state: SharedState) => AgentInput;   // 从状态提取输入
  outputAdapter: (output: AgentOutput, state: SharedState) => void; // 输出写入状态
  tools: Tool[];                       // 可调用的工具集
}
```

### 3.2 内部执行循环（Agent Loop）

每个 WorkflowUnit 内部都运行着标准的 ReAct 循环——这正是 pi-agent-core 的 `AgentLoop`：

```
┌───────────────────────────────────────────┐
│            WorkflowUnit 内部循环            │
│                                           │
│   ┌─────────┐    ┌──────────┐            │
│   │ Thought  │───▶│  Action  │            │
│   │ (推理)   │◀───│ (工具调用)│            │
│   └─────────┘    └────┬─────┘            │
│        ▲              │                   │
│        │    ┌─────────▼──────────┐        │
│        └────│   Observation      │        │
│             │   (工具结果+新消息)  │        │
│             └────────────────────┘        │
│                                           │
│   终止条件检查（TerminationPolicy）         │
│   → 满足则产出 WorkflowUnitOutput          │
│   → 否则继续循环                            │
└───────────────────────────────────────────┘
```

**关键认知：ReAct 不是一种"模式"，而是每个 WorkflowUnit 的默认执行引擎。** 所有更高层的模式（Plan-Execute、Multi-Agent 等）都是在 ReAct 引擎之上叠加控制流。

### 3.3 终止策略

```typescript
type TerminationPolicy =
  | { type: 'stop-reason'; reasons: StopReason[] }      // LLM 自然终止
  | { type: 'max-steps'; steps: number }                 // 步数上限
  | { type: 'condition'; predicate: (state: SharedState) => boolean }  // 自定义条件
  | { type: 'delegation'; targetUnitId: string }         // 委派给其他单元时终止
  | { type: 'composite'; policies: TerminationPolicy[]; op: 'and' | 'or' };
```

---

## 4. 第二层：ControlFlow —— 编排策略

所有控制流实现统一接口：

```typescript
interface ControlFlow {
  readonly type: string;
  next(state: SharedState): WorkflowUnit[];  // 下一步执行哪些单元
  isComplete(state: SharedState): boolean;   // 工作流是否完成
}
```

### 4.1 循环流（Loop）—— ReAct 就是单单元循环

```
[start] → [Unit A] ───→ done
            ↑    │
            └────┘（未满足终止条件时循环）
```

```typescript
class LoopFlow implements ControlFlow {
  type = 'loop';
  constructor(
    private unit: WorkflowUnit,
    private maxIterations: number,
    private terminationCondition?: (state: SharedState) => boolean
  ) {}
  private iterations = 0;

  next(state: SharedState): WorkflowUnit[] {
    if (this.iterations >= this.maxIterations) return [];
    if (this.terminationCondition?.(state)) return [];
    this.iterations++;
    return [this.unit];
  }

  isComplete(state: SharedState): boolean {
    return this.iterations >= this.maxIterations ||
      (this.terminationCondition?.(state) ?? false);
  }
}
```

### 4.2 顺序流（Sequential）—— Chain 模式

```
[Unit A] → [Unit B] → [Unit C] → done
```

```typescript
class SequentialFlow implements ControlFlow {
  type = 'sequential';
  constructor(private units: WorkflowUnit[]) {}
  private currentIndex = 0;

  next(state: SharedState): WorkflowUnit[] {
    if (this.currentIndex >= this.units.length) return [];
    return [this.units[this.currentIndex++]];
  }

  isComplete(state: SharedState): boolean {
    return this.currentIndex >= this.units.length;
  }
}
```

### 4.3 并行流（Parallel）—— Map-Reduce 的 Map 阶段

```
        ┌→ [Unit A] ─┐
[start]─┼→ [Unit B] ─┼→ [Reducer] → done
        └→ [Unit C] ─┘
```

```typescript
class ParallelFlow implements ControlFlow {
  type = 'parallel';
  constructor(
    private units: WorkflowUnit[],
    private reducer: WorkflowUnit
  ) {}
  private completed = new Set<string>();
  private reducing = false;

  next(state: SharedState): WorkflowUnit[] {
    if (this.completed.size < this.units.length) {
      return this.units.filter(u => !this.completed.has(u.id));
    }
    if (!this.reducing) {
      this.reducing = true;
      return [this.reducer];
    }
    return [];
  }

  isComplete(state: SharedState): boolean {
    return this.reducing && this.completed.has(this.reducer.id);
  }
}
```

### 4.4 路由流（Router）—— 条件分发

```
                    ┌→ [Handler A]
[start] → [Router] ─┼→ [Handler B]
                    └→ [Handler C]
```

```typescript
class RouterFlow implements ControlFlow {
  type = 'router';
  constructor(
    private router: WorkflowUnit,
    private handlers: Map<string, WorkflowUnit>,
    private routeExtractor: (output: AgentOutput) => string
  ) {}
  private routed = false;
  private selectedKey: string | null = null;

  next(state: SharedState): WorkflowUnit[] {
    if (!this.routed) return [this.router];
    if (this.selectedKey && !state.get(`handler.${this.selectedKey}.done`)) {
      return [this.handlers.get(this.selectedKey)!];
    }
    return [];
  }

  // Router 完成后由外部调用
  onRouterComplete(output: AgentOutput) {
    this.routed = true;
    this.selectedKey = this.routeExtractor(output);
  }

  isComplete(state: SharedState): boolean {
    return this.selectedKey !== null &&
      state.get(`handler.${this.selectedKey}.done`) === true;
  }
}
```

### 4.5 DAG 流（Plan-and-Execute）

```
        ┌→ [Step 1] ──────┐
[Plan] ─┼→ [Step 2] ─┐    ├→ [Aggregate] → done
        │             ├────┘
        └→ [Step 3] ─┘
```

```typescript
class DAGFlow implements ControlFlow {
  type = 'dag';
  constructor(
    private planner: WorkflowUnit,
    private executors: Map<string, WorkflowUnit>,
    private aggregator: WorkflowUnit,
    private dependencies: Map<string, string[]>
  ) {}

  next(state: SharedState): WorkflowUnit[] {
    const plan = state.get('plan');
    if (!plan) return [this.planner];  // 阶段1：规划

    // 阶段2：按拓扑排序执行
    const ready = this.getReadySteps(state);
    if (ready.length > 0) return ready.map(s => this.executors.get(s)!);

    // 阶段3：聚合
    if (this.allStepsDone(state) && !state.get('aggregated')) {
      return [this.aggregator];
    }
    return [];
  }

  isComplete(state: SharedState): boolean {
    return state.get('aggregated') === true;
  }

  private getReadySteps(state: SharedState): string[] {
    const done = state.get('completedSteps') || new Set<string>();
    return [...this.executors.keys()].filter(stepId =>
      !done.has(stepId) &&
      (this.dependencies.get(stepId) || []).every(dep => done.has(dep))
    );
  }

  private allStepsDone(state: SharedState): boolean {
    const done = state.get('completedSteps') || new Set<string>();
    return done.size >= this.executors.size;
  }
}
```

### 4.6 委派流（Delegation）—— Multi-Agent 层级协作

```
[Orchestrator] ──delegate──→ [Specialist A]
       │                          │
       └──────delegate──────────→ [Specialist B]
       │                          │
       ◀──────result──────────────┘
```

```typescript
class DelegationFlow implements ControlFlow {
  type = 'delegation';
  constructor(
    private orchestrator: WorkflowUnit,
    private specialists: Map<string, WorkflowUnit>
  ) {}
  private delegationQueue: string[] = [];
  private phase: 'orchestrating' | 'executing' | 'finalizing' = 'orchestrating';

  next(state: SharedState): WorkflowUnit[] {
    if (this.phase === 'orchestrating') {
      return [this.orchestrator];
    }
    if (this.phase === 'executing') {
      const next = this.delegationQueue.shift();
      if (next) return [this.specialists.get(next)!];
      this.phase = 'finalizing';
      return [this.orchestrator];  // 回收给 Orchestrator 综合决策
    }
    return [];
  }

  // Orchestrator 输出中的委派请求
  onOrchestratorOutput(output: AgentOutput) {
    const delegations = extractDelegations(output);
    if (delegations.length > 0) {
      this.delegationQueue = delegations.map(d => d.targetUnitId);
      this.phase = 'executing';
    }
  }

  isComplete(state: SharedState): boolean {
    return state.get('orchestrator.finalized') === true;
  }
}
```

### 4.7 复合流（Composite）—— 控制流嵌套

控制流本身可任意嵌套——DAG 的某个 executor 可以是 LoopFlow，Router 的 handler 可以是 DAGFlow：

```typescript
class CompositeFlow implements ControlFlow {
  type = 'composite';
  constructor(private flows: ControlFlow[]) {}

  next(state: SharedState): WorkflowUnit[] {
    for (const flow of this.flows) {
      if (!flow.isComplete(state)) return flow.next(state);
    }
    return [];
  }

  isComplete(state: SharedState): boolean {
    return this.flows.every(f => f.isComplete(state));
  }
}
```

### 4.8 控制流一览

| 控制流 | 对应模式 | 核心行为 |
|--------|---------|---------|
| LoopFlow | ReAct | 单个单元自循环直到终止条件 |
| SequentialFlow | Chain | 单元按顺序逐个执行 |
| ParallelFlow | Map-Reduce（Map阶段） | 多单元并发 + Reducer 汇总 |
| RouterFlow | Router | 分类→选择→分发 |
| DAGFlow | Plan-and-Execute | 规划→拓扑排序→并行执行→聚合 |
| DelegationFlow | Multi-Agent（层级） | 编排→委派→执行→回收 |
| CompositeFlow | 任意嵌套组合 | 子控制流顺序组合 |

---

## 5. 第三层：MessageBus + SharedState —— 通信与状态

### 5.1 设计原理

消息总线是 WorkflowUnit 之间**唯一的通信渠道**，确保：
- **解耦**：单元之间不直接引用
- **可观测**：所有通信经过总线，可完整记录和审计
- **可注入**：支持 Steering 和 FollowUp 等运行时干预

### 5.2 消息类型

```typescript
type WorkflowMessage =
  | { type: 'unit-output'; sourceUnitId: string; data: AgentOutput; timestamp: number }
  | { type: 'delegation'; sourceUnitId: string; targetUnitId: string; task: string; timestamp: number }
  | { type: 'steering'; targetUnitId: string; content: string; timestamp: number }
  | { type: 'followup'; targetUnitId: string; content: string; timestamp: number }
  | { type: 'broadcast'; sourceUnitId: string; content: string; timestamp: number }
  | { type: 'state-update'; key: string; value: any; timestamp: number };
```

### 5.3 共享状态

```typescript
interface SharedState {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  delete(key: string): void;
  has(key: string): boolean;
  snapshot(): Record<string, any>;
}
```

共享状态使得 Planner 可以将计划写入 `state.set('plan', planSteps)`，Executor 可以读取 `state.get('plan')` 获取任务，Aggregator 可以读取所有步骤结果进行汇总。

---

## 6. pi-agent-core 三大机制的映射

### 机制一：Agent Loop → 统一原子执行引擎

pi-agent-core 的 `AgentLoop` 是**所有模式的不可再分执行单元**。无论外层是 Router、DAG 还是 Multi-Agent，每个 Agent 实例内部都在跑同一个循环：

```
LLM 调用 → 工具调用 → 结果回填 → LLM 再调用 → ... → stopReason
```

### 机制二：事件驱动 → 统一可观测性

`agent.subscribe()` 暴露 10 种事件类型，让外层 ControlFlow **无需侵入 Agent 内部即可感知执行进度**：

| 事件 | ControlFlow 用途 |
|------|-----------------|
| `agent_start` | 记录单元启动 |
| `turn_start` | 计数、超时检测 |
| `tool_execution_start` | 安全审计 |
| `tool_execution_end` | 检测是否需要 Steering |
| `message_end` | 提取结构化输出写入 SharedState |
| `agent_end` | 标记单元完成，触发下一个单元 |

### 机制三：Steering / FollowUp → 统一的运行时干预

这是 pi-agent-core **区别于其他框架的关键能力**，直接支撑了三种控制流原语：

```typescript
// Steering → 实现 Router 分发
agent.steer({ role: 'user', content: `Route to: ${handlerId}`, timestamp: Date.now() });

// Steering → 实现 Multi-Agent 委派
specialist.steer({ role: 'user', content: `Task delegated: ${task}`, timestamp: Date.now() });

// FollowUp → 实现 Plan-Execute 的步骤推进
executor.followUp({ role: 'user', content: `Next step: ${nextPlanStep}`, timestamp: Date.now() });
```

| 机制 | 对应控制流操作 |
|------|-------------|
| `steer()` | Router 路由分发、Multi-Agent 委派、Reflexion 反馈 |
| `followUp()` | Plan-Execute 步骤推进、Sequential 链式传递 |
| `steeringMode: 'one-at-a-time'` | 防止消息竞态，保证编排顺序 |

---

## 7. 模式映射表：所有模式的统一表达

| 设计模式 | WorkflowUnit 数量 | 控制流类型 | 消息流特点 | pi-agent-core 机制 |
|---------|------------------|-----------|-----------|-------------------|
| **ReAct** | 1 | LoopFlow（自循环） | 内部消息循环 | 默认 `Agent.run()` |
| **Chain** | N | SequentialFlow | 链式传递 | FollowUp 推进 |
| **Router** | 1+N | RouterFlow | 分类→路由→返回 | Steering 分发 |
| **Plan-Execute** | 2+N | DAGFlow | Planner→plan→Executors→Aggregator | FollowUp 推进步骤 |
| **Multi-Agent（层级）** | 1+N | DelegationFlow | Orchestrator 委派+回收 | Steering 委派 |
| **Multi-Agent（对等）** | N | ParallelFlow + Broadcast | 广播 + 点对点 | 多 Agent 并行 + 事件监听 |
| **Reflexion** | 2 | LoopFlow { SequentialFlow } | Actor→Evaluator 反馈 | Steering 注入反馈 |
| **Map-Reduce** | 1+N+1 | ParallelFlow + SequentialFlow | Map→并行处理→Reduce | Parallel + FollowUp |

### 各模式可视化

**ReAct：**
```
┌─────────────────────────────────┐
│      WorkflowUnit (ReAct Agent) │
│   Thought → Action → Observation│
│        ↑___________________|    │
│   循环直到 stopReason 出现       │
└─────────────────────────────────┘
```

**Plan-and-Execute：**
```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Planner  │────▶│ Executor │────▶│Aggregator│
│ (ReAct)  │     │ (ReAct)  │     │ (ReAct)  │
│          │     │   × N    │     │          │
└──────────┘     └──────────┘     └──────────┘
     │                │                │
     ▼                ▼                ▼
  plan={...}     step.results={...}   final_output
           SharedState
```

**Multi-Agent（层级协作）：**
```
                  ┌─────────────┐
                  │Orchestrator │
                  │  (ReAct)    │
                  └──┬───┬───┬──┘
            delegate │   │   │ delegate
          ┌──────────┘   │   └──────────┐
          ▼              ▼              ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │Researcher│  │  Coder   │  │ Reviewer │
    │ (ReAct)  │  │ (ReAct)  │  │ (ReAct)  │
    └──────────┘  └──────────┘  └──────────┘
```

**Router：**
```
                    ┌──────────────┐
     user input ───▶│    Router    │
                    │   (ReAct)    │
                    └──┬───┬───┬──┘
          ┌────────────┘   │   └────────────┐
          ▼                ▼                ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │  Code    │    │  Chat    │    │  Search  │
    │ Handler  │    │ Handler  │    │ Handler  │
    │ (ReAct)  │    │ (ReAct)  │    │ (ReAct)  │
    └──────────┘    └──────────┘    └──────────┘
```

**Reflexion：**
```
┌──────────────────────────────────────┐
│         LoopFlow（max 3 iterations）  │
│  ┌──────────┐     ┌──────────┐      │
│  │  Actor   │────▶│Evaluator │      │
│  │ (ReAct)  │     │ (ReAct)  │      │
│  └──────────┘     └────┬─────┘      │
│       ▲                │             │
│       │    feedback    │ score < 8   │
│       └────────────────┘             │
│                    │ score >= 8      │
│                    ▼                 │
│                  done                │
└──────────────────────────────────────┘
```

---

## 8. 混合模式的自洽性证明

### 8.1 数学基础

控制流形成了一个**半群（Semigroup）**：
- **闭合性**：任意两个控制流的组合仍是控制流
- **结合律**：`(A ∘ B) ∘ C = A ∘ (B ∘ C)`
- **单位元**：单单元 LoopFlow 是组合的单位元

### 8.2 五个不变量

统一模型的自洽性由以下不变量保证：

1. **接口统一**：所有 WorkflowUnit 具有完全相同的输入/输出接口（`inputAdapter` / `outputAdapter`）
2. **通信统一**：所有消息通过 MessageBus 传递，无带外通信
3. **状态统一**：所有共享数据通过 SharedState 访问，无全局变量污染
4. **生命周期统一**：每个 WorkflowUnit 的执行是原子的——启动→循环→终止→产出
5. **控制流无关（控制流反转）**：WorkflowUnit 不感知自己处于何种控制流中，只是从 SharedState 读输入、运行 ReAct 循环、写输出到 SharedState、终止

**不变量 5 是最关键的**——它使得任意控制流组合成为可能。一个 DAGFlow 的 executor 可以本身是一个 RouterFlow，而 RouterFlow 的 handler 可以是 DelegationFlow，层层嵌套而无冲突。

### 8.3 混合示例

#### 示例1：Router + Plan-Execute 混合

```
用户请求 → [Router] ──code_request──→ [Plan-Execute Pipeline]
                   │                     ├─ Planner
                   │                     ├─ Coder
                   │                     └─ Reviewer
                   │
                   └──chat_request──→ [ReAct Chat Agent]
```

```typescript
const workflow = new RouterFlow(
  chatOrCodeRouter,
  new Map([
    ['code', new DAGFlow(planner, executors, aggregator, deps)],  // Plan-Execute
    ['chat', new LoopFlow(chatAgent, 10)],                        // ReAct
  ]),
  (output) => output.content.trim()
);
```

#### 示例2：Multi-Agent + Reflexion 混合

```
[Orchestrator]
    │
    ├─ delegate → [Researcher]           ← 普通 Agent
    │
    └─ delegate → [Coder with Reflexion]  ← 带反思的 Agent
                       │
                       └─ LoopFlow(3) {
                            SequentialFlow [CoderActor, CodeEvaluator]
                          }
```

```typescript
const coderWithReflexion = new LoopFlow(
  new SequentialFlow([coderActor, codeEvaluator]),
  3,
  (state) => state.get('codeScore') >= 8
);

const workflow = new DelegationFlow(orchestrator, new Map([
  ['research', researcher],
  ['code', coderWithReflexion],  // 注意：specialist 本身是一个 LoopFlow
]));
```

---

## 9. TypeScript 接口定义

完整的统一工作流模型 TypeScript 接口：

```typescript
// ============================================================
// 核心类型
// ============================================================

type UnitId = string;

interface AgentConfig {
  systemPrompt: string;
  model: Model;
  thinkingLevel: ThinkingLevel;
  tools: Tool[];
  maxSteps: number;
  toolExecution: 'parallel' | 'sequential';
}

type TerminationPolicy =
  | { type: 'stop-reason'; reasons: StopReason[] }
  | { type: 'max-steps'; steps: number }
  | { type: 'condition'; predicate: (state: SharedState) => boolean }
  | { type: 'delegation'; targetUnitId: UnitId }
  | { type: 'composite'; policies: TerminationPolicy[]; op: 'and' | 'or' };

interface WorkflowUnit {
  id: UnitId;
  agent: AgentConfig;
  terminationPolicy: TerminationPolicy;
  inputAdapter: (state: SharedState) => AgentInput;
  outputAdapter: (output: AgentOutput, state: SharedState) => void;
  tools: Tool[];
}

interface AgentInput {
  task: string;
  context?: string;
  delegatedBy?: UnitId;
}

interface AgentOutput {
  content: string;
  toolCalls: ToolCall[];
  stopReason: StopReason;
  metadata: Record<string, any>;
}

// ============================================================
// 控制流
// ============================================================

interface ControlFlow {
  readonly type: string;
  next(state: SharedState): WorkflowUnit[];
  isComplete(state: SharedState): boolean;
}

// ============================================================
// 消息与状态
// ============================================================

type WorkflowMessage =
  | { type: 'unit-output'; sourceUnitId: UnitId; data: AgentOutput; timestamp: number }
  | { type: 'delegation'; sourceUnitId: UnitId; targetUnitId: UnitId; task: string; timestamp: number }
  | { type: 'steering'; targetUnitId: UnitId; content: string; timestamp: number }
  | { type: 'followup'; targetUnitId: UnitId; content: string; timestamp: number }
  | { type: 'broadcast'; sourceUnitId: UnitId; content: string; timestamp: number }
  | { type: 'state-update'; key: string; value: any; timestamp: number };

interface MessageBus {
  publish(message: WorkflowMessage): void;
  subscribe(filter: Partial<WorkflowMessage>, handler: (msg: WorkflowMessage) => void): () => void;
  history(): WorkflowMessage[];
}

interface SharedState {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  delete(key: string): void;
  has(key: string): boolean;
  snapshot(): Record<string, any>;
}

// ============================================================
// 工作流引擎
// ============================================================

interface WorkflowConfig {
  units: Map<UnitId, WorkflowUnit>;
  controlFlow: ControlFlow;
  messageBus?: MessageBus;
  sharedState?: SharedState;
}

interface WorkflowResult {
  state: Record<string, any>;
  messages: WorkflowMessage[];
  completedUnits: UnitId[];
  duration: number;
}

interface WorkflowEngine {
  run(): Promise<WorkflowResult>;
  steer(targetUnitId: UnitId, content: string): void;
  followUp(targetUnitId: UnitId, content: string): void;
  getState(): SharedState;
  getMessages(): WorkflowMessage[];
}
```

### 基于 pi-agent-core 的引擎实现骨架

```typescript
import { Agent, getModel } from '@mariozechner/pi-agent-core';

class PiWorkflowEngine implements WorkflowEngine {
  private agents: Map<UnitId, Agent> = new Map();
  private config: WorkflowConfig;

  constructor(config: WorkflowConfig) {
    this.config = config;
    // 为每个 WorkflowUnit 创建 Agent 实例
    for (const [id, unit] of config.units) {
      this.agents.set(id, new Agent({
        initialState: {
          systemPrompt: unit.agent.systemPrompt,
          model: unit.agent.model,
          thinkingLevel: unit.agent.thinkingLevel,
          tools: unit.tools,
          messages: [],
        },
        toolExecution: unit.agent.toolExecution,
      }));
    }
  }

  async run(): Promise<WorkflowResult> {
    const startTime = Date.now();
    const completedUnits: UnitId[] = [];

    while (!this.config.controlFlow.isComplete(this.config.sharedState!)) {
      const nextUnits = this.config.controlFlow.next(this.config.sharedState!);

      // 并行执行当前批次的单元
      const results = await Promise.all(
        nextUnits.map(async (unit) => {
          const agent = this.agents.get(unit.id)!;
          const input = unit.inputAdapter(this.config.sharedState!);

          // 通过 Steering 注入任务
          agent.steer({
            role: 'user',
            content: input.task,
            timestamp: Date.now(),
          });

          // 等待 Agent 完成
          return new Promise<{ unit: WorkflowUnit; output: AgentOutput }>((resolve) => {
            const unsubscribe = agent.subscribe((event) => {
              if (event.type === 'agent_end') {
                unsubscribe();
                const output = this.extractOutput(agent);
                resolve({ unit, output });
              }
            });
            agent.run();
          });
        })
      );

      // 将输出写入共享状态
      for (const { unit, output } of results) {
        unit.outputAdapter(output, this.config.sharedState!);
        completedUnits.push(unit.id);
        this.config.messageBus?.publish({
          type: 'unit-output',
          sourceUnitId: unit.id,
          data: output,
          timestamp: Date.now(),
        });
      }
    }

    return {
      state: this.config.sharedState!.snapshot(),
      messages: this.config.messageBus?.history() || [],
      completedUnits,
      duration: Date.now() - startTime,
    };
  }

  steer(targetUnitId: UnitId, content: string): void {
    this.agents.get(targetUnitId)?.steer({
      role: 'user', content, timestamp: Date.now(),
    });
  }

  followUp(targetUnitId: UnitId, content: string): void {
    this.agents.get(targetUnitId)?.followUp({
      role: 'user', content, timestamp: Date.now(),
    });
  }

  getState(): SharedState { return this.config.sharedState!; }
  getMessages(): WorkflowMessage[] { return this.config.messageBus?.history() || []; }

  private extractOutput(agent: Agent): AgentOutput {
    const messages = agent.getMessages();
    const lastAssistant = [...messages].reverse()
      .find(m => m.role === 'assistant') as any;
    return {
      content: lastAssistant?.content?.map((c: any) => c.text || '').join('') || '',
      toolCalls: lastAssistant?.content?.filter((c: any) => c.type === 'toolCall') || [],
      stopReason: lastAssistant?.stopReason || 'stop',
      metadata: {},
    };
  }
}
```

---

## 10. 实战：代码审查工作流（全混合模式）

这是一个 Router + Plan-Execute + Reflexion 的真实混合示例：

```
用户代码审查请求
        │
        ▼
    [Router]  判断审查类型
        │
   ┌────┴────────────┐
   ▼                 ▼
 'quick'           'deep'
   │                 │
   ▼                 ▼
[Quick Review]   [DAGFlow - 深度审查]
  (ReAct)           │
                    ├── [Planner]  生成审查计划
                    │       │
                    │       ▼  plan = { steps, deps }
                    │
                    ├── [Security Review]  ←─ 这个步骤带 Reflexion
                    │       │
                    │       └── LoopFlow(max 3) {
                    │             SequentialFlow [
                    │               SecurityActor (ReAct),
                    │               SecurityEvaluator (ReAct)
                    │             ]
                    │           }
                    │
                    ├── [Performance Review]  (ReAct)
                    ├── [Architecture Review]  (ReAct)
                    ├── [Bug Detection]  (ReAct, depends on Security)
                    │
                    └── [Aggregator]  汇总最终报告
```

完整拓扑嵌套：

```
[Router]
   ├── 'quick' ──→ [Quick Reviewer]          ← 简单 ReAct (LoopFlow)
   │
   └── 'deep' ──→ DAGFlow
                    ├── [Planner]              ← ReAct
                    ├── [Security] ──→ LoopFlow(3)  ← Reflexion
                    │    ├── [Actor]           ← ReAct
                    │    └── [Evaluator]       ← ReAct
                    ├── [Performance]          ← ReAct
                    ├── [Architecture]         ← ReAct
                    ├── [Bugs]                 ← ReAct (依赖 Security)
                    └── [Aggregator]           ← ReAct
```

**关键点：** 每一层每个节点内部都是 ReAct 循环，但它们的组合方式由控制流决定。WorkflowUnit 不知道也不关心自己处于哪种控制流中——这就是统一工作流模型的精髓。

---

## 11. 总结公式

```
Agent 工作流 = Σ (WorkflowUnit × ControlFlow)

其中：
  WorkflowUnit = AgentConfig + AgentLoop (ReAct) + TerminationPolicy
  ControlFlow  ∈ { Sequential, Parallel, Router, DAG, Loop, Delegation, Composite }
```

**pi-agent-core 映射：**

```
Agent 工作流 = AgentLoop ⊗ (Steering | FollowUp) ⊗ ControlFlow

其中：
  AgentLoop      → pi-agent-core 的 Agent.run() 默认循环
  Steering       → agent.steer()  运行时打断+重定向
  FollowUp       → agent.followUp() 完成后追加任务
  ControlFlow    → 在 pi-agent-core 之上构建的编排层
```

### 与 pi-agent-core 的分工

| 职责 | pi-agent-core | 统一工作流模型（外层） |
|------|-------------|---------------------|
| LLM 调用 | ✅ `pi-ai` 统一接口 | — |
| Agent 循环 | ✅ `AgentLoop` | — |
| 工具执行 | ✅ parallel / sequential | — |
| 事件系统 | ✅ `subscribe()` | — |
| 消息注入 | ✅ `steer()` / `followUp()` | — |
| 控制流编排 | — | ✅ ControlFlow 实现 |
| 多 Agent 协作 | — | ✅ DelegationFlow |
| 规划执行分离 | — | ✅ DAGFlow |
| 路由分发 | — | ✅ RouterFlow |
| 共享状态 | — | ✅ SharedState |
| 消息总线 | — | ✅ MessageBus |
| 上下文/记忆 | — | ✅ ContextManager（Layer 4） |
| 断点续跑 | — | ✅ CheckpointStore（Layer 4） |
| 可观测性 | — | ✅ Observability（Layer 4） |
| 容错/预算 | — | ✅ PolicyEngine（Layer 4） |
| 安全治理 | — | ✅ SecurityGovernance（Layer 4） |
| 跨框架适配 | — | ✅ RuntimeAdapter Bridge（Layer 4） |

---

## 12. Layer 4：Infrastructure Plane（生产级横切层）

在三层编排模型之上，新增第四层 **Infrastructure Plane**，提供生产环境所需的横切能力：

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Layer 4: Infrastructure Plane                                           │
│  ContextManager │ CheckpointStore │ Observability │ PolicyEngine │ Security│
├──────────────────────────────────────────────────────────────────────────┤
│  Layer 3: MessageBus + SharedState（增强：作用域、事务、新消息类型）         │
├──────────────────────────────────────────────────────────────────────────┤
│  Layer 2: ControlFlow（Checkpoint/HITL 感知、并行失败策略）                │
├──────────────────────────────────────────────────────────────────────────┤
│  Layer 1: WorkflowUnit + RuntimeAdapter（解耦 pi-agent-core）              │
└──────────────────────────────────────────────────────────────────────────┘
```

### 12.1 执行管线

```
ControlFlow.next()
  → PolicyEngine.preCheck
  → SecurityGovernance.preHook
  → ContextManager.assemble
  → RuntimeAdapter.execute
  → SecurityGovernance.postHook
  → outputAdapter → SharedState
  → ContextManager.record
  → CheckpointStore.save
  → Observability.emit
  → MessageBus.publish
```

### 12.2 ContextManager — 四层记忆

| 层级 | 存储 | 生命周期 |
|------|------|---------|
| Working Memory | 内存 | Unit 执行期 |
| Session Memory | 内存 + Checkpoint | 单次 workflow run |
| Long-term Memory | DB | 永久 |
| Vector Memory | 向量 DB | 永久 |

### 12.3 RuntimeAdapter — 跨框架 Bridge

| 框架 | Sidecar 模式 | Wrapper 模式 |
|------|-------------|-------------|
| LangGraph | `UniFlowCheckpointer` | `LangGraphAdapter` |
| LangChain | `UniFlowMemory` | `LangChainAdapter` |
| LangChain4j | `UniFlowChatMemoryStore` | `LangChain4jAdapter` |
| pi-agent-core | 原生 | `PiAgentAdapter` |
| 任意 | — | `McpAdapter` / `HttpAdapter` |

### 12.4 SecurityGovernance — 安全 Hook 链

```
preHook:  AuthZ → ToolPolicy → PIIGuard → SecretMgr → PromptInjection
postHook: PIIGuard → AuditTrail
```

### 12.5 实现参考

TypeScript 参考实现见 `src/` 目录，设计规格见 `openspec/changes/production-agent-workflow-infra/`。

---

### 设计原则

1. **ReAct 是原子引擎**：每个 WorkflowUnit 内部都是 ReAct 循环，这是不可再分的执行单元
2. **控制流是组合子**：控制流是 WorkflowUnit 的组合器（Combinator）
3. **接口统一保证自洽**：所有单元有相同的输入/输出接口，所有控制流有相同的调度接口
4. **消息总线解耦通信**：单元间只通过 MessageBus 和 SharedState 交互
5. **嵌套是自由的**：控制流可以任意嵌套，Router 的 handler 可以是 DAGFlow，DAGFlow 的 executor 可以是 LoopFlow
6. **控制流反转（IoC）**：WorkflowUnit 不感知自己处于何种控制流中——这是任意混合模式自洽的核心

---

> 这套统一工作流模型可以无缝构建在 pi-agent-core 之上，使任何混合模式的 Agent 系统都能在同一套抽象下逻辑自洽地运行。
