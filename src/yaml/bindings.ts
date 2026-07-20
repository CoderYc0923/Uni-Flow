import { createHttpAdapter } from '../adapters/http-adapter.js';
import { YamlLoadError } from './errors.js';
import type { UnitPluginRegistry } from './types.js';

/**
 * 将非内建 `uses` 名绑定到远程 HTTP Unit 端点（供 Orchestrator / `createEngineFromYaml` 的 `bindings`）。
 */
export type HttpUsesBinding = {
  /** 固定为 `'http'`。 */
  type: 'http';
  /** 远程 `POST /execute` 风格 URL。 */
  endpoint: string;
  /** 可选请求头（如鉴权）。 */
  headers?: Record<string, string>;
};

/** `uses` 名 → HTTP 绑定的映射表。 */
export type UsesBindings = Record<string, HttpUsesBinding>;

/**
 * 将 HTTP bindings 物化为 `UnitPluginRegistry` 条目（内部用 {@link createHttpAdapter}）。
 *
 * @param bindings - 可选绑定表
 * @returns 可并入 `registry` 的插件表
 */
export function registryFromBindings(bindings?: UsesBindings): UnitPluginRegistry {
  if (!bindings) return {};
  const registry: UnitPluginRegistry = {};
  for (const [uses, binding] of Object.entries(bindings)) {
    if (!binding || binding.type !== 'http') {
      throw new YamlLoadError(
        `Unsupported binding for "${uses}": only { type: "http", endpoint } is supported`,
      );
    }
    if (!binding.endpoint) {
      throw new YamlLoadError(`Binding for "${uses}" requires endpoint`);
    }
    const endpoint = binding.endpoint;
    const headers = binding.headers;
    registry[uses] = () => createHttpAdapter({ endpoint, headers });
  }
  return registry;
}

/**
 * 从左到右浅合并多个插件表；后写覆盖先写同名键。
 *
 * @param parts - 若干 `UnitPluginRegistry`（可 undefined）
 * @returns 合并后的注册表
 */
export function mergePluginRegistries(
  ...parts: Array<UnitPluginRegistry | undefined>
): UnitPluginRegistry {
  const out: UnitPluginRegistry = {};
  for (const part of parts) {
    if (!part) continue;
    Object.assign(out, part);
  }
  return out;
}
