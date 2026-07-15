## 1. 梳理公开 API 与示例现状

- [x] 1.1 核对 `src/index.ts` 导出清单，列出 README 可引用的工厂与类型
- [x] 1.2 审阅 `examples/code-review-workflow.ts` 与 `examples/start-orchestrator.ts`，记录可复用片段与缺口

## 2. 撰写 README.md

- [x] 2.1 编写简介与价值一句话；绘制全链路解析流程图（系统全景 Mermaid + 中文阶段旁注）
- [x] 2.2 绘制单次 Unit 执行管线 Mermaid（与引擎 Hook 顺序一致）+ 四层架构对照表
- [x] 2.3 编写环境要求与安装；快速开始：Sequential + MockAdapter 迷你完整示例
- [x] 2.4 编写核心概念：WorkflowUnit、ControlFlow、RuntimeAdapter、Layer 4、进程内 vs 远程 SDK
- [x] 2.5 编写完整案例 A（Sequential 流水线）与案例 B（Router，链到 code-review example）
- [x] 2.6 编写完整案例 C（Orchestrator HTTP + UniFlowClient）含 REST 路由表与 MCP 说明
- [x] 2.7 编写 Layer 4 可选能力、Python/Java Sidecar 指引、FAQ 与文档链接

## 3. 示例与校验

- [x] 3.1 必要时补充 `examples/` 文件注释或示例，使其与 README 链接一致
- [x] 3.2 交叉检查 README 代码片段符号均来自公开导出
- [x] 3.3 运行 `npm test` 确认文档变更未破坏构建
