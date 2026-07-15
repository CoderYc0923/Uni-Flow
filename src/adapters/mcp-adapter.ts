import type {
  AgentInput,
  AgentOutput,
  ExecutionContext,
  RuntimeAdapter,
  RuntimeEventHandler,
  Unsubscribe,
} from '../core/types.js';

export interface McpAdapterConfig {
  serverUrl: string;
  toolName?: string;
  callFn?: (serverUrl: string, input: AgentInput, ctx: ExecutionContext) => Promise<AgentOutput>;
}

/**
 * Skeleton MCP adapter. Production usage wires callFn to an MCP client.
 */
export class McpAdapter implements RuntimeAdapter {
  readonly type = 'mcp' as const;
  private handlers: RuntimeEventHandler[] = [];

  constructor(private config: McpAdapterConfig) {}

  async execute(input: AgentInput, ctx: ExecutionContext): Promise<AgentOutput> {
    this.handlers.forEach((h) => h({ type: 'start' }));

    if (!this.config.callFn) {
      throw new Error('McpAdapter requires callFn to be configured');
    }

    const output = await this.config.callFn(this.config.serverUrl, input, ctx);
    this.handlers.forEach((h) => h({ type: 'end', output }));
    return output;
  }

  steer(_content: string): void {}
  followUp(_content: string): void {}

  subscribe(handler: RuntimeEventHandler): Unsubscribe {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  cancel(): void {}

  frameworkInfo(): { name: string; version: string } {
    return { name: 'mcp', version: '1.0.0' };
  }
}

export function createMcpAdapter(config: McpAdapterConfig): McpAdapter {
  return new McpAdapter(config);
}
