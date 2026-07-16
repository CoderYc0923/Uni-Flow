# 安装

Uni-Flow 是 Node.js 标准库，用于 Agent 统一编排。本节说明环境要求、安装步骤与本地文档预览。

## 环境要求

| 项目 | 要求 |
|------|------|
| Node.js | `>= 18`（见 `package.json` 的 `engines.node`） |
| 包管理器 | npm（仓库默认） |

## 安装与构建

在仓库根目录执行：

```bash
git clone https://github.com/CoderYc0923/Uni-Flow.git
cd Uni-Flow
npm install
npm run build
npm test
```

| 命令 | 作用 |
|------|------|
| `npm install` | 安装依赖 |
| `npm run build` | TypeScript 编译到 `dist/` |
| `npm test` | 运行 Vitest 测试套件 |
| `npm run typecheck` | 仅类型检查，不产出文件 |

构建完成后，CLI 入口为 `dist/cli/uniflow.js`，可通过 `npm run uniflow -- validate <path>` 调用。

## 可选依赖

以下包列为 **optionalDependencies**，未安装时对应 Layer4 能力降级为内存实现：

| 包 | 用途 |
|----|------|
| `@opentelemetry/api` | OpenTelemetry 可观测性（`createOpenTelemetryObservability`） |
| `ioredis` | Redis 检查点存储（`createRedisCheckpointStore`） |

未安装时 `npm install` 不会失败；需要 Redis / OTel 时再单独安装即可。

## 本地文档预览

VitePress 文档位于 `docs-web/`：

```bash
npm run docs:dev
```

浏览器打开终端提示的本地地址（默认 `http://localhost:5173/Uni-Flow/`）。

完整构建（含 TypeDoc 生成附录）：

```bash
npm run docs:build
```

## 下一步

- [快速开始](/guide/quickstart) — 进程内 Sequential 示例
- [YAML 与 validate](/guide/yaml) — 声明式工作流
