import type { AgentOutput, Tool } from '../core/types.js';
import type { CallerIdentity, SecurityContext, SecurityDecision, SecurityGovernance, SanitizedOutput } from './types.js';

const PII_PATTERNS = [
  /\b[\w.-]+@[\w.-]+\.\w+\b/g, // email
  /\b1[3-9]\d{9}\b/g, // CN phone
  /\b\d{15,18}\b/g, // id numbers
];

/**
 * 基础安全治理配置：工具白名单、Unit 授权、HITL 工具与默认 caller。
 */
export interface SecurityConfig {
  /** 允许的工具名列表；未设则不按工具白名单拦截。 */
  allowedTools?: string[];
  /** caller id → 允许的 Unit id 列表。 */
  allowedUnits?: Record<string, string[]>;
  /** 触发 HITL 的工具名。 */
  hitlTools?: string[];
  /** 默认调用方身份。 */
  caller?: CallerIdentity;
}

/**
 * 基础安全治理：pre/post hook、简易 PII 脱敏与审计日志。
 */
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

/**
 * 创建 {@link BasicSecurityGovernance}。
 *
 * @param config - 可选安全配置
 * @returns 安全治理实例
 */
export function createSecurityGovernance(config?: SecurityConfig): BasicSecurityGovernance {
  return new BasicSecurityGovernance(config);
}
