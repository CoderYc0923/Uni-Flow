import type {
  AgentInput,
  AgentOutput,
  ExecutionContext,
  RuntimeAdapter,
  RuntimeEventHandler,
  Unsubscribe,
} from '../core/types.js';

export interface HttpAdapterConfig {
  endpoint: string;
  headers?: Record<string, string>;
  fetchFn?: typeof fetch;
}

export class HttpAdapter implements RuntimeAdapter {
  readonly type = 'http' as const;
  private handlers: RuntimeEventHandler[] = [];
  private aborted = false;

  constructor(private config: HttpAdapterConfig) {}

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

  steer(_content: string): void {
    // HTTP adapter: steering via follow-up execute call
  }

  followUp(_content: string): void {}

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
    return { name: 'http', version: '1.0.0' };
  }
}

export function createHttpAdapter(config: HttpAdapterConfig): HttpAdapter {
  return new HttpAdapter(config);
}
