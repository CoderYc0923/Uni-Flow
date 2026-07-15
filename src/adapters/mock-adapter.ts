import type {
  AgentInput,
  AgentOutput,
  ExecutionContext,
  RuntimeAdapter,
  RuntimeEventHandler,
  StopReason,
  Unsubscribe,
} from '../core/types.js';

export interface MockAdapterOptions {
  responseFn?: (input: AgentInput) => AgentOutput | Promise<AgentOutput>;
  delayMs?: number;
  frameworkName?: string;
}

export class MockRuntimeAdapter implements RuntimeAdapter {
  readonly type = 'mock' as const;
  private handlers: RuntimeEventHandler[] = [];
  private aborted = false;
  private pendingSteering: string[] = [];
  private pendingFollowUp: string[] = [];

  constructor(private options: MockAdapterOptions = {}) {}

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

  steer(content: string): void {
    this.pendingSteering.push(content);
  }

  followUp(content: string): void {
    this.pendingFollowUp.push(content);
  }

  subscribe(handler: RuntimeEventHandler): Unsubscribe {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  cancel(): void {
    this.aborted = true;
  }

  frameworkInfo(): { name: string; version: string } {
    return { name: this.options.frameworkName ?? 'mock', version: '1.0.0' };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createMockAdapter(options?: MockAdapterOptions): MockRuntimeAdapter {
  return new MockRuntimeAdapter(options);
}
