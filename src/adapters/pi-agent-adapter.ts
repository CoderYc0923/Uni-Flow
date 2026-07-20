import type {
  AgentInput,
  AgentOutput,
  ExecutionContext,
  RuntimeAdapter,
  RuntimeEventHandler,
  Unsubscribe,
} from '../core/types.js';

/** pi-agent-core 适配器配置：注入 execute（及可选 steer/followUp/cancel）。 */
export interface PiAgentAdapterConfig {
  /** 可选系统提示，由调用方自行拼进 executeFn。 */
  systemPrompt?: string;
  /** 实际执行一轮 Agent 的函数（必填）。 */
  executeFn: (input: AgentInput, ctx: ExecutionContext) => Promise<AgentOutput>;
  /** 运行中转向回调。 */
  steerFn?: (content: string) => void;
  /** 追问回调。 */
  followUpFn?: (content: string) => void;
  /** 取消回调。 */
  cancelFn?: () => void;
}

/**
 * pi-agent-core 的 RuntimeAdapter：通过注入的 `executeFn` 解耦真实 Agent 循环，便于测试与集成。
 */
export class PiAgentAdapter implements RuntimeAdapter {
  readonly type = 'pi-agent' as const;
  private handlers: RuntimeEventHandler[] = [];

  constructor(private config: PiAgentAdapterConfig) {}

  async execute(input: AgentInput, ctx: ExecutionContext): Promise<AgentOutput> {
    this.handlers.forEach((h) => h({ type: 'start' }));
    try {
      const output = await this.config.executeFn(input, ctx);
      if (output.tokenUsage) {
        this.handlers.forEach((h) => h({ type: 'token-usage', usage: output.tokenUsage! }));
      }
      this.handlers.forEach((h) => h({ type: 'end', output }));
      return output;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.handlers.forEach((h) => h({ type: 'error', error }));
      throw error;
    }
  }

  steer(content: string): void {
    this.config.steerFn?.(content);
  }

  followUp(content: string): void {
    this.config.followUpFn?.(content);
  }

  subscribe(handler: RuntimeEventHandler): Unsubscribe {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  cancel(): void {
    this.config.cancelFn?.();
  }

  frameworkInfo(): { name: string; version: string } {
    return { name: 'pi-agent-core', version: '0.73.1' };
  }
}

/**
 * 创建 {@link PiAgentAdapter}。
 *
 * @param config - 须提供 `executeFn`
 * @returns pi-agent RuntimeAdapter
 */
export function createPiAgentAdapter(config: PiAgentAdapterConfig): PiAgentAdapter {
  return new PiAgentAdapter(config);
}
