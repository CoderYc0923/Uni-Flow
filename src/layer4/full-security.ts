import type { AgentOutput } from '../core/types.js';
import type {
  CallerIdentity,
  SanitizedOutput,
  SecurityContext,
  SecurityDecision,
  SecurityGovernance,
} from './types.js';

const DEFAULT_PII_PATTERNS: { name: string; pattern: RegExp }[] = [
  { name: 'email', pattern: /\b[\w.-]+@[\w.-]+\.\w+\b/g },
  { name: 'phone_cn', pattern: /\b1[3-9]\d{9}\b/g },
  { name: 'id_number', pattern: /\b\d{15,18}\b/g },
  { name: 'ssn', pattern: /\b\d{3}-\d{2}-\d{4}\b/g },
  { name: 'credit_card', pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g },
];

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/i,
  /disregard\s+(your\s+)?(system\s+)?prompt/i,
  /you\s+are\s+now\s+(DAN|unrestricted)/i,
  /reveal\s+(your\s+)?system\s+prompt/i,
  /jailbreak/i,
];

export interface SecretProvider {
  resolve(ref: string): Promise<string | undefined>;
}

export class MapSecretProvider implements SecretProvider {
  constructor(private secrets: Record<string, string> = {}) {}

  async resolve(ref: string): Promise<string | undefined> {
    return this.secrets[ref];
  }

  set(ref: string, value: string): void {
    this.secrets[ref] = value;
  }
}

export interface FullSecurityConfig {
  allowedTools?: string[];
  allowedUnits?: Record<string, string[]>;
  hitlTools?: string[];
  caller?: CallerIdentity;
  /** When true, injection hits deny instead of only audit. */
  blockInjection?: boolean;
  piiPatterns?: { name: string; pattern: RegExp }[];
  secretProvider?: SecretProvider;
  /** Tool parameter JSON Schema by tool name (basic type checks). */
  toolSchemas?: Record<string, { required?: string[]; properties?: Record<string, { type?: string }> }>;
}

/**
 * Full SecurityGovernance: AuthZ + ToolPolicy + SecretMgr + PIIGuard + PromptInjection + Audit.
 */
export class FullSecurityGovernance implements SecurityGovernance {
  private audit: { timestamp: number; event: string; details: Record<string, unknown> }[] = [];
  private secretProvider: SecretProvider;

  constructor(private config: FullSecurityConfig = {}) {
    this.secretProvider = config.secretProvider ?? new MapSecretProvider();
  }

  preHook(ctx: SecurityContext): SecurityDecision {
    this.audit.push({
      timestamp: Date.now(),
      event: 'preHook',
      details: { unitId: ctx.unitId, caller: ctx.caller.id },
    });

    const allowedUnits = this.config.allowedUnits?.[ctx.caller.id];
    if (allowedUnits && !allowedUnits.includes(ctx.unitId) && !allowedUnits.includes('*')) {
      return { action: 'deny', reason: `Caller not authorized for unit: ${ctx.unitId}` };
    }

    if (this.config.allowedTools) {
      for (const tool of ctx.tools) {
        if (!this.config.allowedTools.includes(tool.name)) {
          this.audit.push({
            timestamp: Date.now(),
            event: 'tool-denied',
            details: { tool: tool.name, unitId: ctx.unitId },
          });
          return { action: 'deny', reason: `Tool not in whitelist: ${tool.name}` };
        }
        if (this.config.hitlTools?.includes(tool.name)) {
          return {
            action: 'require-hitl',
            hitlAction: `tool:${tool.name}`,
            payload: { tool: tool.name },
          };
        }
      }
    }

    const injection = this.detectInjection(ctx.input.task);
    if (injection) {
      this.audit.push({
        timestamp: Date.now(),
        event: 'prompt-injection-detected',
        details: { unitId: ctx.unitId, matched: injection },
      });
      if (this.config.blockInjection) {
        return { action: 'deny', reason: `Prompt injection detected: ${injection}` };
      }
    }

    return { action: 'allow' };
  }

  postHook(ctx: SecurityContext, output: AgentOutput): SanitizedOutput {
    const { text, redacted, matches } = this.redactPII(output.content);
    this.audit.push({
      timestamp: Date.now(),
      event: 'postHook',
      details: { unitId: ctx.unitId, redacted, matches },
    });
    return { output: { ...output, content: text }, redacted };
  }

  async resolveSecrets(refs: string[]): Promise<Record<string, string>> {
    const out: Record<string, string> = {};
    for (const ref of refs) {
      const value = await this.secretProvider.resolve(ref);
      if (value !== undefined) out[ref] = value;
    }
    return out;
  }

  sanitizeInput(text: string): { text: string; redacted: boolean } {
    const { text: t, redacted } = this.redactPII(text);
    return { text: t, redacted };
  }

  getAuditLog(): { timestamp: number; event: string; details: Record<string, unknown> }[] {
    return [...this.audit];
  }

  private redactPII(text: string): { text: string; redacted: boolean; matches: string[] } {
    const patterns = this.config.piiPatterns ?? DEFAULT_PII_PATTERNS;
    let redacted = false;
    let result = text;
    const matches: string[] = [];
    for (const { name, pattern } of patterns) {
      const re = new RegExp(pattern.source, pattern.flags);
      if (re.test(result)) {
        redacted = true;
        matches.push(name);
        result = result.replace(new RegExp(pattern.source, pattern.flags), `[REDACTED:${name}]`);
      }
    }
    return { text: result, redacted, matches };
  }

  private detectInjection(input: string): string | null {
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(input)) return pattern.source;
    }
    return null;
  }
}

export function createFullSecurityGovernance(config?: FullSecurityConfig): FullSecurityGovernance {
  return new FullSecurityGovernance(config);
}
