# 安装

本页把你当成第一次接触 Uni-Flow 的 TypeScript 开发者：装好依赖，确认能 `import`，再进入下一页跑通第一个工作流。

## 你将完成什么

在**自己的** Node/TS 项目里装上 npm 包 **`virtual-uni-flow`**（产品名仍是 Uni-Flow），并能写出一行：

```typescript
import { createEngineFromYaml } from 'virtual-uni-flow';
```

而不报「找不到模块」。

## 先记住两句话

1. **完整 Engine（YAML → 控制流 → 执行）目前只有 TypeScript。** Python / Java SDK 是 HTTP 客户端或 Unit 边界，不是「本语言里的完整编排引擎」。
2. **单项目进程内跑编排，一般不需要启动 Orchestrator。**

## 前置条件

| 项目 | 要求 | 如何自检 |
|------|------|----------|
| Node.js | `>= 18` | 终端执行 `node -v` |
| 包管理器 | npm / pnpm / yarn | `npm -v` |
| 项目类型 | TypeScript 或可跑 TS 的 Node 项目 | 已有 `package.json` |

若还没有项目：

```bash
mkdir my-uniflow-app
cd my-uniflow-app
npm init -y
npm install typescript tsx --save-dev
npx tsc --init
```

## 步骤 1：安装 `virtual-uni-flow`（推荐）

```bash
npm install virtual-uni-flow
```

registry：https://www.npmjs.com/package/virtual-uni-flow  

> 说明：npm 上 `uni-flow` 与已有包名过于相似不可用，故公开发布名为 **`virtual-uni-flow`**。CLI 二进制仍为 `uniflow`。

### 备选：Git 依赖

```bash
npm install github:CoderYc0923/Uni-Flow#main
```

安装后仍按 `package.json` 的 `name` 导入，即 `from 'virtual-uni-flow'`。

### 备选：本地 path（你正在改 Uni-Flow 本仓时）

```bash
# 终端 1：Uni-Flow 仓库
cd /path/to/Uni-Flow
npm install
npm run build

# 在你的应用 package.json 的 dependencies 中写：
# "virtual-uni-flow": "file:../Uni-Flow"
# 然后：
npm install
```

> Windows 注意：`file:` 路径用正斜杠或正确的相对路径；改完本仓源码后需重新 `npm run build`，应用才能吃到新 `dist/`。

## 步骤 2：写一个最小探测脚本

在应用根目录创建 `smoke-import.mts`（或 `.ts`）：

```typescript
import { createEngineFromYaml, createMockAdapter } from 'virtual-uni-flow';

console.log('ok', typeof createEngineFromYaml, typeof createMockAdapter);
```

运行：

```bash
npx tsx smoke-import.mts
```

### 预期结果

终端类似：

```text
ok function function
```

若出现 `Cannot find module 'virtual-uni-flow'`：回到步骤 1，确认 `node_modules/virtual-uni-flow` 存在，且本仓 path 依赖已 `build`。

## 步骤 3（可选）：贡献者克隆本仓库

只有在你要**改引擎、跑文档站、跑仓库内示例**时才需要：

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
| `npx uniflow validate <yaml>` | 校验 Workflow YAML（需先 build） |
| `npm run docs:dev` | 本地文档站 |

## 常见问题

| 现象 | 处理 |
|------|------|
| path 依赖改了代码但行为没变 | 在本仓重新 `npm run build` |
| `tsx` 找不到 | `npm install -D tsx` |
| 想用 Python/Java「装完整 Engine」 | 当前做不到；见能力边界，跨项目用 HTTP Unit |

## Orchestrator 何时需要？

| 场景 | 需要 Orchestrator？ |
|------|---------------------|
| 单 TS 进程内跑 YAML / 代码 API | **否** |
| 多进程注册 YAML、用 HTTP 启 run | **是** |
| 父项目把另一 TS 服务当 Unit（子暴露 `/execute`） | 父可用进程内 Engine + bindings；Orchestrator 可选 |

## 可选依赖

| 包 | 用途 |
|----|------|
| `@opentelemetry/api` | OpenTelemetry |
| `ioredis` | Redis Checkpoint |

未安装时自动降级为内存实现，不影响入门。

## 下一步

跟做第一个工作流 → [快速开始](/guide/quickstart)（推荐先走路径 A：Mock Sequential）。
