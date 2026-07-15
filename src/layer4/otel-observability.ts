import type { LogLevel, Observability, SpanContext, SpanStatus } from './types.js';
import type { TokenUsage, UnitId } from '../core/types.js';
import { InMemoryObservability } from './observability.js';

/**
 * Optional OpenTelemetry-compatible exporter hooks.
 * Pass real OTel API objects when @opentelemetry/api is installed.
 */
export interface OTelHooks {
  startActiveSpan?: (
    name: string,
    fn: (span: { setAttribute: (k: string, v: string) => void; end: () => void; setStatus: (s: { code: number }) => void }) => void,
  ) => void;
  recordMetric?: (name: string, value: number, attributes?: Record<string, string>) => void;
}

/**
 * Observability that mirrors spans/metrics to optional OpenTelemetry hooks
 * while keeping the in-memory buffer for local inspection.
 */
export class OpenTelemetryObservability implements Observability {
  private inner = new InMemoryObservability();

  constructor(private hooks: OTelHooks = {}) {}

  startSpan(name: string, parent?: SpanContext): SpanContext {
    const ctx = this.inner.startSpan(name, parent);
    this.hooks.startActiveSpan?.(name, (span) => {
      span.setAttribute('span.id', ctx.spanId);
      span.setAttribute('trace.id', ctx.traceId);
      if (parent) span.setAttribute('parent.span.id', parent.spanId);
    });
    return ctx;
  }

  endSpan(ctx: SpanContext, status: SpanStatus): void {
    this.inner.endSpan(ctx, status);
  }

  recordMetric(name: string, value: number, tags: Record<string, string> = {}): void {
    this.inner.recordMetric(name, value, tags);
    this.hooks.recordMetric?.(name, value, tags);
  }

  log(level: LogLevel, message: string, fields: Record<string, unknown> = {}): void {
    this.inner.log(level, message, fields);
  }

  recordCost(unitId: UnitId, usage: TokenUsage): void {
    this.inner.recordCost(unitId, usage);
    this.hooks.recordMetric?.('uniflow.tokens', usage.totalTokens, { unitId });
    if (usage.estimatedCost != null) {
      this.hooks.recordMetric?.('uniflow.cost', usage.estimatedCost, { unitId });
    }
  }

  getSpans(): SpanContext[] {
    return this.inner.getSpans();
  }

  getMetrics() {
    return this.inner.getMetrics();
  }

  getLogs() {
    return this.inner.getLogs();
  }

  getTotalCost(): number {
    return this.inner.getTotalCost();
  }

  getTotalTokens(): number {
    return this.inner.getTotalTokens();
  }
}

export function createOpenTelemetryObservability(hooks?: OTelHooks): OpenTelemetryObservability {
  return new OpenTelemetryObservability(hooks);
}

/**
 * Try to load @opentelemetry/api and wire basic hooks. Returns undefined if not installed.
 */
export async function tryCreateOTelFromPackage(): Promise<OpenTelemetryObservability | undefined> {
  try {
    const otel = await import('@opentelemetry/api' as string);
    const api = otel as {
      trace: { getTracer: (name: string) => { startActiveSpan: OTelHooks['startActiveSpan'] } };
      metrics: { getMeter: (name: string) => { createCounter: (n: string) => { add: (v: number, a?: Record<string, string>) => void } } };
    };
    const tracer = api.trace.getTracer('uni-flow');
    const meter = api.metrics.getMeter('uni-flow');
    const counters = new Map<string, { add: (v: number, a?: Record<string, string>) => void }>();

    return createOpenTelemetryObservability({
      startActiveSpan: (name, fn) => tracer.startActiveSpan?.(name, fn),
      recordMetric: (name, value, attributes) => {
        let c = counters.get(name);
        if (!c) {
          c = meter.createCounter(name);
          counters.set(name, c);
        }
        c.add(value, attributes);
      },
    });
  } catch {
    return undefined;
  }
}
