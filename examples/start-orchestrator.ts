/**
 * 案例 C：本地 Orchestrator HTTP 服务 + 演示工作流 `demo`。
 *
 * 对应 README「完整案例 C」。
 *
 * 启动方式（开发态可用 vitest 间接覆盖；生产前请 `npm run build` 并用 Node 加载编译产物，
 * 或从 TS 工具链 import 本文件后调用 `startDemoOrchestrator()`）：
 *
 *   const server = await startDemoOrchestrator(8787);
 *   // POST http://127.0.0.1:8787/workflows/demo/runs
 *   //      { "input": { "task": "..." }, "sync": true }
 *
 * REST / MCP 路由表见 README。
 */
import {
  createWorkflowRegistry,
  createOrchestratorServer,
  createSharedState,
  SequentialFlow,
  createMockAdapter,
  createEnhancedContextManager,
  createVectorStore,
  createLongTermMemoryStore,
  createRedisCheckpointStore,
  InMemoryRedisClient,
  createFullSecurityGovernance,
  DEFAULT_CONTEXT_POLICY,
} from '../src/index.js';
import type { WorkflowUnit } from '../src/core/types.js';

function unit(id: string): WorkflowUnit {
  return {
    id,
    runtime: createMockAdapter({
      responseFn: (input) => ({
        content: `${id} done: ${input.task}`,
        toolCalls: [],
        stopReason: 'stop',
        metadata: {},
      }),
    }),
    terminationPolicy: { type: 'stop-reason', reasons: ['stop'] },
    inputAdapter: (state) => ({ task: String(state.get('task') ?? '') }),
    outputAdapter: (o, s) => s.set(`out.${id}`, o.content),
    contextPolicy: DEFAULT_CONTEXT_POLICY,
  };
}

export async function startDemoOrchestrator(port = 8787) {
  const a = unit('planner');
  const b = unit('executor');
  const registry = createWorkflowRegistry({
    checkpointStore: createRedisCheckpointStore(new InMemoryRedisClient()),
    contextManager: createEnhancedContextManager({
      vectorStore: createVectorStore('memory'),
      longTermMemory: createLongTermMemoryStore(),
    }),
    security: createFullSecurityGovernance({ allowedTools: [] }),
  });

  registry.register('demo', () => ({
    config: {
      workflowId: 'demo',
      units: new Map([
        ['planner', a],
        ['executor', b],
      ]),
      controlFlow: new SequentialFlow([a, b]),
      sharedState: createSharedState(),
    },
  }));

  const server = createOrchestratorServer({
    registry,
    contextManager: createEnhancedContextManager({
      vectorStore: createVectorStore('memory'),
    }),
    port,
  });
  const info = await server.start();
  console.log(`Uni-Flow Orchestrator listening at ${info.url}`);
  console.log('POST /workflows/demo/runs  { "input": { "task": "..." }, "sync": true }');
  console.log('POST /mcp  JSON-RPC tools/call');
  return server;
}

const isMain =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  (process.argv[1].includes('start-orchestrator') ||
    process.argv[1].endsWith('start-orchestrator.ts') ||
    process.argv[1].endsWith('start-orchestrator.js'));

if (isMain) {
  void startDemoOrchestrator();
}
