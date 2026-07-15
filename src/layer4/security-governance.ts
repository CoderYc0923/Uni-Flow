import type { AgentOutput, Tool } from '../core/types.js';
import type { CallerIdentity, SecurityContext, SecurityDecision, SecurityGovernance, SanitizedOutput } from './types.js';

const PII_PATTERNS = [
  /\b[\w.-]+@[\w.-]+\.\w+\b/g, // email
  /\b1[3-9]\d{9}\b/g, // CN phone
  /\b\d{15,18}\b/g, // id numbers
];

export interface SecurityConfig {
  allowedTools?: string[];
  allowedUnits?: Record<string, string[]>;
  hitlTools?: string[];
  caller?: CallerIdentity;
}

export class BasicSecurityGovernance implements SecurityGovernance {
  private audit: { timestamp: number; event: string; details: Record<string, unknown> }[] = [];

  constructor(private config: SecurityConfig = {}) {}

  preHook(ctx: SecurityContext): SecurityDecision {
    this.audit.push({
      timestamp: Date.now(),
      event: 'preHook',
      details: { unitId: ctx.unitId, caller: ctx.caller.id },
    });

    const allowedUnits = this.config.allowedUnits?.[ctx.caller.id];
    if (allowedUnits && !allowedUnits.includes(ctx.unitId)) {
      return { action: 'deny', reason: `Caller not authorized for unit: ${ctx.unitId}` };
    }

    if (this.config.allowedTools) {
      for (const tool of ctx.tools) {
        if (!this.config.allowedTools.includes(tool.name)) {
          return { action: 'deny', reason: `Tool not in whitelist: ${tool.name}` };
        }
        if (this.config.hitlTools?.includes(tool.name)) {
          return { action: 'require-hitl', hitlAction: `tool:${tool.name}`, payload: { tool: tool.name } };
        }
      }
    }

    if (this.detectInjection(ctx.input.task)) {
      this.audit.push({
        timestamp: Date.now(),
        event: 'prompt-injection-detected',
        details: { unitId: ctx.unitId },
      });
    }

    return { action: 'allow' };
  }

  postHook(ctx: SecurityContext, output: AgentOutput): SanitizedOutput {
    const { text, redacted } = this.redactPII(output.content);
    this.audit.push({
      timestamp: Date.now(),
      event: 'postHook',
      details: { unitId: ctx.unitId, redacted },
    });
    return {
      output: { ...output, content: text },
      redacted,
    };
  }

  getAuditLog(): { timestamp: number; event: string; details: Record<string, unknown> }[] {
    return [...this.audit];
  }

  private redactPII(text: string): { text: string; redacted: boolean } {
    let redacted = false;
    let result = text;
    for (const pattern of PII_PATTERNS) {
      if (pattern.test(result)) {
        redacted = true;
        result = result.replace(pattern, '[REDACTED]');
      }
    }
    return { text: result, redacted };
  }

  private detectInjection(input: string): boolean {
    const lower = input.toLowerCase();
    return (
      lower.includes('ignore previous instructions') ||
      lower.includes('ignore all prior') ||
      lower.includes('system prompt')
    );
  }
}

export function createSecurityGovernance(config?: SecurityConfig): BasicSecurityGovernance {
  return new BasicSecurityGovernance(config);
}
