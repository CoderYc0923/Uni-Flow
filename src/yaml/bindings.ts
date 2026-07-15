import { createHttpAdapter } from '../adapters/http-adapter.js';
import { YamlLoadError } from './errors.js';
import type { UnitPluginRegistry } from './types.js';

export type HttpUsesBinding = {
  type: 'http';
  endpoint: string;
  headers?: Record<string, string>;
};

export type UsesBindings = Record<string, HttpUsesBinding>;

/**
 * Materialize HTTP bindings as UnitPluginRegistry entries (via HttpAdapter / builtin.http shape).
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
