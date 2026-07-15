import type { TokenUsage, UnitId } from '../core/types.js';
import type { LogLevel, Observability, SpanContext, SpanStatus } from './types.js';

let spanCounter = 0;

export class InMemoryObservability implements Observability {
  private spans: (SpanContext & { endTime?: number; status?: SpanStatus })[] = [];
  private metrics: { name: string; value: number; tags: Record<string, string> }[] = [];
  private logs: { level: LogLevel; message: string; fields: Record<string, unknown>; timestamp: number }[] = [];
  private totalCost = 0;
  private totalTokens = 0;

  startSpan(name: string, parent?: SpanContext): SpanContext {
    const ctx: SpanContext = {
      spanId: `span-${++spanCounter}`,
      traceId: parent?.traceId ?? `trace-${Date.now()}`,
      name,
      parentSpanId: parent?.spanId,
      startTime: Date.now(),
      attributes: {},
    };
    this.spans.push(ctx);
    return ctx;
  }

  endSpan(ctx: SpanContext, status: SpanStatus): void {
    const span = this.spans.find((s) => s.spanId === ctx.spanId);
    if (span) {
      span.endTime = Date.now();
      span.status = status;
      this.recordMetric('span.duration', (span.endTime - span.startTime), {
        name: ctx.name,
        status,
      });
    }
  }

  recordMetric(name: string, value: number, tags: Record<string, string> = {}): void {
    this.metrics.push({ name, value, tags });
  }

  log(level: LogLevel, message: string, fields: Record<string, unknown> = {}): void {
    this.logs.push({ level, message, fields, timestamp: Date.now() });
  }

  recordCost(unitId: UnitId, usage: TokenUsage): void {
    this.totalTokens += usage.totalTokens;
    this.totalCost += usage.estimatedCost ?? 0;
    this.recordMetric('unit.tokens', usage.totalTokens, { unitId });
    if (usage.estimatedCost) {
      this.recordMetric('unit.cost', usage.estimatedCost, { unitId });
    }
  }

  getSpans(): SpanContext[] {
    return [...this.spans];
  }

  getMetrics(): { name: string; value: number; tags: Record<string, string> }[] {
    return [...this.metrics];
  }

  getLogs(): { level: LogLevel; message: string; fields: Record<string, unknown>; timestamp: number }[] {
    return [...this.logs];
  }

  getTotalCost(): number {
    return this.totalCost;
  }

  getTotalTokens(): number {
    return this.totalTokens;
  }
}

export function createObservability(): InMemoryObservability {
  return new InMemoryObservability();
}
