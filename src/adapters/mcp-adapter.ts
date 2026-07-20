import type {
  AgentInput,
  AgentOutput,
  ExecutionContext,
  RuntimeAdapter,
  RuntimeEventHandler,
  Unsubscribe,
} from '../core/types.js';

/**
 * MCP RuntimeAdapter 配置：通过注入的 `callFn` 调用 MCP 工具（骨架适配器）。
 */
export interface McpAdapterConfig {
  /** MCP 服务端 URL 或标识。 */
  serverUrl: string;
  /** 可选工具名。 */
  toolName?: string;
  /**
   * 实际调用函数；未提供时 `execute` 会抛错。
   * 生产环境请接到真实 MCP client。
   */
  callFn?: (serverUrl: string, input: AgentInput, ctx: ExecutionContext) => Promise<AgentOutput>;
}

/**
 * MCP 骨架 RuntimeAdapter：把 Unit 执行委托给可注入的 `callFn`。
 *
 * 未配置 `callFn` 时调用 `execute` 会抛错；便于测试时 Mock。
 */
export class McpAdapter implements RuntimeAdapter {
  readonly type = 'mcp' as const;
  private handlers: RuntimeEventHandler[] = [];

  /**
   * @param config - 服务端 URL 与可选 `callFn`
   */
  constructor(private config: McpAdapterConfig) {}

  /**
   * 调用 `config.callFn` 并派发 start/end 事件。
   *
   * @param input - Agent 输入
   * @param ctx - 执行上下文
   * @returns Agent 输出
   */
  async execute(input: AgentInput, ctx: ExecutionContext): Promise<AgentOutput> {
    this.handlers.forEach((h) => h({ type: 'start' }));

    if (!this.config.callFn) {
      throw new Error('McpAdapter requires callFn to be configured');
    }

    const output = await this.config.callFn(this.config.serverUrl, input, ctx);
    this.handlers.forEach((h) => h({ type: 'end', output }));
    return output;
  }

  /** MCP 适配器暂不支持 steer（空操作）。 */
  steer(_content: string): void {}
  /** MCP 适配器暂不支持 followUp（空操作）。 */
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

/**
 * 创建 {@link McpAdapter}。
 *
 * @param config - MCP 适配器配置
 * @returns RuntimeAdapter 实例
 */
export function createMcpAdapter(config: McpAdapterConfig): McpAdapter {
  return new McpAdapter(config);
}
