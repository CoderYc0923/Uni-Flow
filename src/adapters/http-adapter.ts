import type {
  AgentInput,
  AgentOutput,
  ExecutionContext,
  RuntimeAdapter,
  RuntimeEventHandler,
  Unsubscribe,
} from '../core/types.js';

/**
 * HTTP RuntimeAdapter 配置：把 Unit 执行委托给远程 `/execute` 风格端点。
 *
 * 请求体为 `{ input, context }` JSON；响应体须可解析为 {@link AgentOutput}。
 */
export interface HttpAdapterConfig {
  /** 远程 Unit 的 HTTP 端点 URL（通常 POST）。 */
  endpoint: string;
  /** 附加请求头（如鉴权）；默认仍会带 `Content-Type: application/json`。 */
  headers?: Record<string, string>;
  /**
   * 可注入的 `fetch`（便于单测 Mock）；默认使用全局 `fetch`。
   */
  fetchFn?: typeof fetch;
}

/**
 * 通过 HTTP 调用远程 Unit 的 RuntimeAdapter。
 *
 * 适用于跨项目 / Workflow-as-Unit：本进程发 POST，对端返回标准 {@link AgentOutput}。
 * `steer` / `followUp` 在此适配器中为空操作（需靠后续 `execute` 传递）。
 *
 * @example
 * ```ts
 * const adapter = createHttpAdapter({
 *   endpoint: 'http://127.0.0.1:3100/execute',
 *   fetchFn: async () =>
 *     new Response(
 *       JSON.stringify({
 *         content: 'remote-ok',
 *         toolCalls: [],
 *         stopReason: 'stop',
 *         metadata: {},
 *       }),
 *       { status: 200, headers: { 'Content-Type': 'application/json' } },
 *     ),
 * });
 * ```
 */
export class HttpAdapter implements RuntimeAdapter {
  readonly type = 'http' as const;
  private handlers: RuntimeEventHandler[] = [];
  private aborted = false;

  /**
   * @param config 端点、头与可选 `fetchFn`
   */
  constructor(private config: HttpAdapterConfig) {}

  /**
   * POST `config.endpoint`，将 `{ input, context: ctx }` 发往远端并解析为 {@link AgentOutput}。
   *
   * @param input 标准 Agent 输入（含可选 `params`）
   * @param ctx 执行上下文；`abortSignal` 会传给 `fetch`
   * @returns 远端返回的 AgentOutput
   * @throws 当 HTTP 状态非 2xx 时抛出错误
   */
  async execute(input: AgentInput, ctx: ExecutionContext): Promise<AgentOutput> {
    this.aborted = false;
    this.handlers.forEach((h) => h({ type: 'start' }));

    const fetchFn = this.config.fetchFn ?? fetch;
    const response = await fetchFn(this.config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.config.headers },
      body: JSON.stringify({ input, context: ctx }),
      signal: ctx.abortSignal,
    });

    if (!response.ok) {
      throw new Error(`HTTP adapter error: ${response.status} ${response.statusText}`);
    }

    const output = (await response.json()) as AgentOutput;
    this.handlers.forEach((h) => h({ type: 'end', output }));
    return output;
  }

  /** HTTP 适配器不缓冲转向；需在后续 execute 中自行携带。 */
  steer(_content: string): void {
    // HTTP adapter: steering via follow-up execute call
  }

  /** HTTP 适配器不缓冲追问；需在后续 execute 中自行携带。 */
  followUp(_content: string): void {}

  /**
   * @param handler 运行时事件回调
   * @returns 取消订阅函数
   */
  subscribe(handler: RuntimeEventHandler): Unsubscribe {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  /** 标记本地取消意图（进行中的 fetch 仍依赖 `abortSignal`）。 */
  cancel(): void {
    this.aborted = true;
  }

  /**
   * @returns 固定为 `{ name: 'http', version: '1.0.0' }`
   */
  frameworkInfo(): { name: string; version: string } {
    return { name: 'http', version: '1.0.0' };
  }
}

/**
 * 创建 {@link HttpAdapter}，用于 YAML bindings / registry 中的 HTTP Unit。
 *
 * @param config 必填 `endpoint`，可选 `headers` / `fetchFn`
 * @returns HTTP RuntimeAdapter 实例
 *
 * @example
 * ```ts
 * import { createHttpAdapter } from 'uni-flow';
 *
 * const child = createHttpAdapter({
 *   endpoint: 'http://localhost:4001/execute',
 *   headers: { Authorization: 'Bearer demo' },
 * });
 * ```
 */
export function createHttpAdapter(config: HttpAdapterConfig): HttpAdapter {
  return new HttpAdapter(config);
}
