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

/**
 * 内建 `uses` 插件：`builtin.mock`（本地占位）与 `builtin.http`（需 `config.endpoint`）。
 * 自定义插件请通过 {@link createEngineFromYaml} 的 `registry` 注册。
 */
export const BUILTIN_PLUGINS: UnitPluginRegistry = {
  'builtin.mock': (config) => mockFromConfig(config),
  'builtin.http': (config) => httpFromConfig(config),
};

/**
 * 按名解析 Unit 插件：先查用户 `registry`，再查 builtins；都没有则抛错。
 *
 * @param uses - 插件名（如 `demo.echo` / `builtin.mock`）
 * @param registry - 用户注册表（可选）
 * @param builtins - 内建表，默认 {@link BUILTIN_PLUGINS}
 * @returns 插件工厂或静态结果
 */
export function resolvePlugin(
  uses: string,
  registry: UnitPluginRegistry | undefined,
  builtins: UnitPluginRegistry = BUILTIN_PLUGINS,
): UnitPlugin {
  if (registry && uses in registry) return registry[uses]!;
  if (uses in builtins) return builtins[uses]!;
  throw new Error(`Unresolved uses: ${uses}`);
}
