import { createHttpAdapter } from '../adapters/http-adapter.js';
import { createMockAdapter } from '../adapters/mock-adapter.js';
import type { AgentInput, AgentOutput, RuntimeAdapter } from '../core/types.js';
import type { UnitPlugin, UnitPluginRegistry } from './types.js';

function mockFromConfig(config?: Record<string, unknown>): RuntimeAdapter {
  const response = (config?.response ?? config?.content) as string | undefined;
  const route = config?.route as string | undefined;
  return createMockAdapter({
    responseFn: (input: AgentInput): AgentOutput => {
      const content = response ?? route ?? `Mock response to: ${input.task}`;
      return {
        content,
        toolCalls: [],
        stopReason: 'stop',
        metadata: route ? { route } : {},
        tokenUsage: {
          promptTokens: 5,
          completionTokens: 10,
          totalTokens: 15,
          estimatedCost: 0.001,
        },
      };
    },
  });
}

function httpFromConfig(config?: Record<string, unknown>): RuntimeAdapter {
  const endpoint = config?.endpoint as string | undefined;
  if (!endpoint) {
    throw new Error('builtin.http requires config.endpoint');
  }
  return createHttpAdapter({
    endpoint,
    headers: (config?.headers as Record<string, string> | undefined) ?? undefined,
  });
}

export const BUILTIN_PLUGINS: UnitPluginRegistry = {
  'builtin.mock': (config) => mockFromConfig(config),
  'builtin.http': (config) => httpFromConfig(config),
};

export function resolvePlugin(
  uses: string,
  registry: UnitPluginRegistry | undefined,
  builtins: UnitPluginRegistry = BUILTIN_PLUGINS,
): UnitPlugin {
  if (registry && uses in registry) return registry[uses]!;
  if (uses in builtins) return builtins[uses]!;
  throw new Error(`Unresolved uses: ${uses}`);
}
