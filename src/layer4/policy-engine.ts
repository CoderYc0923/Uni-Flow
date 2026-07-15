import type { AgentOutput } from '../core/types.js';
import type { PolicyConfig, PolicyContext, PolicyDecision, PolicyEngine } from './types.js';
import { DEFAULT_POLICY_CONFIG } from './types.js';

export class DefaultPolicyEngine implements PolicyEngine {
  private consecutiveFailures = 0;
  private circuitOpenedAt: number | null = null;
  private requestTimestamps: number[] = [];

  constructor(private config: PolicyConfig = DEFAULT_POLICY_CONFIG) {}

  preCheck(ctx: PolicyContext): PolicyDecision {
    if (this.isCircuitOpen()) {
      return { action: 'pause', reason: 'Circuit breaker is open' };
    }

    if (ctx.totalTokens >= this.config.budget.maxTokens) {
      return { action: 'abort', reason: 'Token budget exceeded' };
    }
    if (ctx.totalCost >= this.config.budget.maxCost) {
      return { action: 'abort', reason: 'Cost budget exceeded' };
    }

    const now = Date.now();
    if (now - ctx.startTime > this.config.timeout.workflowMs) {
      return { action: 'abort', reason: 'Workflow timeout exceeded' };
    }

    this.requestTimestamps = this.requestTimestamps.filter((t) => now - t < 60_000);
    if (this.requestTimestamps.length >= this.config.rateLimit.maxRequestsPerMinute) {
      return { action: 'pause', reason: 'Rate limit exceeded' };
    }
    this.requestTimestamps.push(now);

    return { action: 'proceed' };
  }

  onError(error: Error, ctx: PolicyContext): PolicyDecision {
    this.recordFailure();

    if (ctx.attempt < this.config.retry.maxAttempts) {
      const delayMs =
        this.config.retry.backoff === 'exponential'
          ? this.config.retry.baseMs * Math.pow(2, ctx.attempt - 1)
          : this.config.retry.baseMs;
      return { action: 'retry', delayMs };
    }

    return { action: 'abort', reason: error.message };
  }

  onComplete(_result: AgentOutput, _ctx: PolicyContext): void {
    this.consecutiveFailures = 0;
    this.circuitOpenedAt = null;
  }

  recordFailure(): void {
    this.consecutiveFailures++;
    if (this.consecutiveFailures >= this.config.circuitBreaker.failureThreshold) {
      this.circuitOpenedAt = Date.now();
    }
  }

  isCircuitOpen(): boolean {
    if (this.circuitOpenedAt === null) return false;
    if (Date.now() - this.circuitOpenedAt > this.config.circuitBreaker.resetMs) {
      this.circuitOpenedAt = null;
      this.consecutiveFailures = 0;
      return false;
    }
    return true;
  }

  resetCircuit(): void {
    this.circuitOpenedAt = null;
    this.consecutiveFailures = 0;
  }
}

export function createPolicyEngine(config?: Partial<PolicyConfig>): DefaultPolicyEngine {
  return new DefaultPolicyEngine({ ...DEFAULT_POLICY_CONFIG, ...config });
}
