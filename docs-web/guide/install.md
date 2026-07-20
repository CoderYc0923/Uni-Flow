# 安装

**完整 Uni-Flow Engine（YAML → ControlFlow → 管线）目前仅 TypeScript / Node.js。**  
Python / Java SDK 是 HTTP 客户端或 Unit 边界，不能替代进程内 Engine（远期可移植，当前勿按「完整编排」安装）。

## 环境要求

| 项目 | 要求 |
|------|------|
| Node.js | `>= 18` |
| 包管理器 | npm / pnpm / yarn |

## 在自有 TS 项目中使用（推荐）

包名：`uni-flow`（见仓库根 `package.json`）。

### 目标命令（发布到 npm 后）

```bash
npm install uni-flow
```

### 今日可用路径（尚未发布到 registry 时）

**Git 依赖：**

```bash
npm install github:CoderYc0923/Uni-Flow#main
```

**本地 path（开发 Uni-Flow 本仓时）：**

```bash
# 在 Uni-Flow 仓库
npm install && npm run build

# 在你的应用 package.json
# "uni-flow": "file:../Uni-Flow"
npm install
```

然后在应用中：

```typescript
import { createEngineFromYaml } from 'uni-flow';

const engine = await createEngineFromYaml('./my.workflow.yaml', {
  // registry: { 'my.agent': () => ... }
});
const result = await engine.run({ task: 'hello' });
```

单项目 **不必** 启动 Orchestrator；进程内 Engine 即可。见 [快速开始](/guide/quickstart)。

## 贡献者：克隆本仓库

维护 / 跑文档与示例时：

```bash
git clone https://github.com/CoderYc0923/Uni-Flow.git
cd Uni-Flow
npm install
npm run build
npm test
```

| 命令 | 作用 |
|------|------|
| `npm run build` | 编译到 `dist/` |
| `npm test` | Vitest |
| `npx uniflow validate <yaml>` | Schema 校验（需先 build） |
| `npm run docs:dev` | 本地文档 |

## 可选依赖

| 包 | 用途 |
|----|------|
| `@opentelemetry/api` | OpenTelemetry |
| `ioredis` | Redis Checkpoint |

未安装时降级为内存实现。

## Orchestrator 何时需要？

| 场景 | 是否需要 Orchestrator |
|------|------------------------|
| 单 TS 进程内跑 YAML / 代码 API | **否** |
| 多进程注册 YAML、HTTP 启 run、父项目远程 `from-yaml` | **是** |
| 把另一 TS 项目当 Unit（子暴露 `/execute`） | 父可用进程内 Engine + HttpAdapter，或 Orchestrator；子是独立 HTTP 服务 |

跨项目（TS↔TS Unit）：[跨项目复用](/guide/cross-project)。

## 下一步

- [快速开始](/guide/quickstart)
- [YAML 与 validate](/guide/yaml)
- [跨项目复用（TS↔TS）](/guide/cross-project)
