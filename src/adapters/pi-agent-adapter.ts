import type {
  AgentInput,
  AgentOutput,
  ExecutionContext,
  RuntimeAdapter,
  RuntimeEventHandler,
  Unsubscribe,
} from '../core/types.js';

export interface PiAgentAdapterConfig {
  systemPrompt?: string;
  executeFn: (input: AgentInput, ctx: ExecutionContext) => Promise<AgentOutput>;
  steerFn?: (content: string) => void;
  followUpFn?: (content: string) => void;
  cancelFn?: () => void;
}

/**
 * Adapter for pi-agent-core. Accepts injected execute functions so the core
 * Agent loop can be wired without tight coupling in tests.
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

export function createPiAgentAdapter(config: PiAgentAdapterConfig): PiAgentAdapter {
  return new PiAgentAdapter(config);
}
