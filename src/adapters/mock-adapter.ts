import type {
  AgentInput,
  AgentOutput,
  ExecutionContext,
  RuntimeAdapter,
  RuntimeEventHandler,
  StopReason,
  Unsubscribe,
} from '../core/types.js';

/**
 * Mock RuntimeAdapter 的配置项。
 *
 * 用于本地测试与示例：无需真实 LLM，可自定义返回或模拟延迟。
 */

export interface MockAdapterOptions {
  /**
   * 自定义响应函数；未提供时返回基于 `task` / 上下文拼接的占位文本。
   * @param input 当前 Unit 的 {@link AgentInput}
   */
  responseFn?: (input: AgentInput) => AgentOutput | Promise<AgentOutput>;
  /** 执行前人为延迟（毫秒），便于测取消 / 超时。 */
  delayMs?: number;
  /** `frameworkInfo().name` 的覆盖值（默认 `"mock"`）。 */
  frameworkName?: string;
}

/**
 * 进程内 Mock 适配器：实现 {@link RuntimeAdapter}，适合单测与快速开始示例。
 *
 * 支持 `steer` / `followUp` 缓冲、`cancel` / abort，以及事件订阅。
 *
 * @example
 * ```ts
 * const adapter = createMockAdapter({
 *   responseFn: (input) => ({
 *     content: `echo:${input.task}`,
 *     toolCalls: [],
 *     stopReason: 'stop',
 *     metadata: {},
 *   }),
 * });
 * const out = await adapter.execute(
 *   { task: 'hello' },
 *   ctx, // 测试里构造的 ExecutionContext
 * );
 * ```
 */

export class MockRuntimeAdapter implements RuntimeAdapter {
  readonly type = 'mock' as const;
  private handlers: RuntimeEventHandler[] = [];
  private aborted = false;
  private pendingSteering: string[] = [];
  private pendingFollowUp: string[] = [];
  /**
   * @param options Mock 行为配置；可省略以使用默认占位响应。
   */
  constructor(private options: MockAdapterOptions = {}) {}
  /**
   * 执行一轮 Mock：发出 `start`，可选延迟，再返回 `responseFn` 或默认内容。
   *
   * @param input 标准 Agent 输入
   * @param ctx 执行上下文（含 `abortSignal`）
   * @returns 标准 {@link AgentOutput}；若已取消则 `stopReason` 为 `cancelled`
   */
  async execute(input: AgentInput, ctx: ExecutionContext): Promise<AgentOutput> {
    this.aborted = false;
    this.handlers.forEach((h) => h({ type: 'start' }));
    if (this.options.delayMs) {
      await sleep(this.options.delayMs);
    }
    if (this.aborted || ctx.abortSignal.aborted) {
      const output: AgentOutput = {
        content: '',
        toolCalls: [],
        stopReason: 'cancelled',
        metadata: {},
      };
      this.handlers.forEach((h) => h({ type: 'end', output }));
      return output;
    }
    const contextParts = [
      input.task,
      input.context,
      ...this.pendingSteering,
      ...this.pendingFollowUp,
      ...ctx.assembledContext.messages.map((m) => m.content),
    ].filter(Boolean);
    const output =
      (await this.options.responseFn?.(input)) ??
      ({
        content: `Mock response to: ${contextParts.join(' | ')}`.slice(0, 500),
        toolCalls: [],
        stopReason: 'stop' as StopReason,
        metadata: {},
        tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30, estimatedCost: 0.001 },
      } satisfies AgentOutput);
    if (output.tokenUsage) {
      this.handlers.forEach((h) => h({ type: 'token-usage', usage: output.tokenUsage! }));
    }
    this.handlers.forEach((h) => h({ type: 'end', output }));
    return output;
  }
  /** 缓冲转向内容，下一次 `execute` 会拼进默认响应上下文。 */
  steer(content: string): void {
    this.pendingSteering.push(content);
  }
  /** 缓冲追问内容，下一次 `execute` 会拼进默认响应上下文。 */
  followUp(content: string): void {
    this.pendingFollowUp.push(content);
  }
  /**
   * 订阅运行时事件。
   * @param handler 事件回调
   * @returns 取消订阅函数
   */
  subscribe(handler: RuntimeEventHandler): Unsubscribe {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }
  /** 标记取消；进行中的 `execute` 将尽快以 `cancelled` 结束。 */
  cancel(): void {
    this.aborted = true;
  }
  /**
   * @returns Mock 框架名与固定版本 `"1.0.0"`
   */
  frameworkInfo(): { name: string; version: string } {
    return { name: this.options.frameworkName ?? 'mock', version: '1.0.0' };
  }
}
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 创建 {@link MockRuntimeAdapter}，供 YAML `uses` registry、单测与快速开始使用。
 *
 * @param options 可选 Mock 配置（自定义 `responseFn`、延迟等）
 * @returns 可直接挂到 Unit 上的 Mock 适配器实例
 *
 * @example
 * ```ts
 * import { createMockAdapter } from 'uni-flow';
 *
 * const runtime = createMockAdapter({
 *   responseFn: async (input) => ({
 *     content: JSON.stringify(input.params ?? {}),
 *     toolCalls: [],
 *     stopReason: 'stop',
 *     metadata: {},
 *   }),
 * });
 * ```
 */

export function createMockAdapter(options?: MockAdapterOptions): MockRuntimeAdapter {
  return new MockRuntimeAdapter(options);
}
