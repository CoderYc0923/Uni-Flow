import type { IncomingMessage, ServerResponse } from 'node:http';
import type { AgentInput, AgentOutput, WorkflowResult } from '../core/types.js';
import { createEngineFromYaml, type CreateEngineFromYamlOptions } from './loader.js';

/**
 * {@link runWorkflowAsUnit} 的选项：继承 YAML 引擎选项，并控制如何把 `WorkflowResult` 映射为 `AgentOutput`。
 */
export interface RunWorkflowAsUnitOptions extends CreateEngineFromYamlOptions {
  /**
   * 作为 `AgentOutput.content` 的 SharedState 键（默认：第一个 `output.*`，否则 `"done"`）。
   */
  contentStateKey?: string;
  /**
   * 自定义完整 `AgentOutput` 映射；提供时忽略默认映射逻辑。
   */
  mapResult?: (result: WorkflowResult, input: AgentInput) => AgentOutput;
}

function defaultMapResult(
  result: WorkflowResult,
  input: AgentInput,
  contentStateKey?: string,
): AgentOutput {
  const content = contentStateKey
    ? String(result.state[contentStateKey] ?? 'done')
    : String(
        Object.entries(result.state).find(([k]) => k.startsWith('output.'))?.[1] ?? 'done',
      );
  const mode = input.params?.mode;
  return {
    content,
    toolCalls: [],
    stopReason: 'stop',
    metadata: {
      completedUnits: result.completedUnits,
      ...(typeof input.params?.$profile === 'string'
        ? { profile: input.params.$profile }
        : {}),
      ...(typeof mode === 'string' ? { mode } : {}),
    },
    tokenUsage: {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: result.tokenUsage,
      estimatedCost: result.cost,
    },
  };
}

/**
 * 把整份 Workflow YAML 当作**单个 Unit** 执行：`AgentInput` → `engine.run` → `AgentOutput`。
 *
 * 用于跨项目 TS↔TS 组合（子服务对外只暴露 Unit 契约）。业务旋钮放在 `input.params`（勿放 secrets）。
 *
 * @param source - Workflow YAML 路径或文本（同 {@link createEngineFromYaml}）
 * @param input - 标准 Unit 输入（`task` / 可选 `context` / `params`）
 * @param options - registry、bindings、内容键或自定义 `mapResult`
 * @returns 符合 Remote Unit 契约的 {@link AgentOutput}
 *
 * @example
 * ```ts
 * import { runWorkflowAsUnit, createMockAdapter } from 'uni-flow';
 *
 * const out = await runWorkflowAsUnit(
 *   yamlText,
 *   { task: 'summarize', params: { mode: 'brief' } },
 *   {
 *     registry: { 'demo.echo': () => createMockAdapter() },
 *     contentStateKey: 'output.echo',
 *   },
 * );
 * console.log(out.content, out.metadata);
 * ```
 */
export async function runWorkflowAsUnit(
  source: string,
  input: AgentInput,
  options: RunWorkflowAsUnitOptions = {},
): Promise<AgentOutput> {
  const { contentStateKey, mapResult, ...engineFromYamlOptions } = options;
  const engine = await createEngineFromYaml(source, engineFromYamlOptions);
  const result = await engine.run({
    task: input.task,
    ...(input.params ? { params: input.params } : {}),
    ...(input.context ? { context: input.context } : {}),
  });
  if (mapResult) return mapResult(result, input);
  return defaultMapResult(result, input, contentStateKey);
}

/**
 * {@link createWorkflowAsUnitHttpHandler} 的选项。
 */
export interface WorkflowAsUnitHttpHandlerOptions extends RunWorkflowAsUnitOptions {
  /**
   * URL 路径须以此后缀结尾才处理（默认 `/execute`）。
   */
  pathEndsWith?: string;
}

/**
 * 创建 Node.js HTTP 监听器：处理 `POST .../execute`，请求体为 Remote Unit JSON `{ input }`。
 *
 * 成功返回 200 + {@link AgentOutput}；失败返回 500，且 `stopReason: 'error'`。
 * 非 POST 或不匹配路径时返回 404。
 *
 * @param source - 子工作流 YAML 路径或文本
 * @param options - 同 {@link runWorkflowAsUnit}，外加 `pathEndsWith`
 * @returns `(req, res) => void`，可直接交给 `http.createServer`
 *
 * @example
 * ```ts
 * import { createServer } from 'node:http';
 * import { createWorkflowAsUnitHttpHandler } from 'uni-flow';
 *
 * const handler = createWorkflowAsUnitHttpHandler('./child.workflow.yaml', {
 *   registry: myRegistry,
 * });
 * createServer(handler).listen(3100);
 * ```
 */
export function createWorkflowAsUnitHttpHandler(
  source: string,
  options: WorkflowAsUnitHttpHandlerOptions = {},
): (req: IncomingMessage, res: ServerResponse) => void {
  const pathEndsWith = options.pathEndsWith ?? '/execute';
  return (req, res) => {
    if (req.method !== 'POST' || !req.url?.endsWith(pathEndsWith)) {
      res.writeHead(404);
      res.end();
      return;
    }
    let raw = '';
    req.on('data', (c) => {
      raw += c;
    });
    req.on('end', () => {
      void (async () => {
        try {
          const body = JSON.parse(raw || '{}') as { input?: AgentInput };
          const output = await runWorkflowAsUnit(source, body.input ?? { task: '' }, options);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(output));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              content: '',
              toolCalls: [],
              stopReason: 'error',
              metadata: { error: err instanceof Error ? err.message : String(err) },
            } satisfies AgentOutput),
          );
        }
      })();
    });
  };
}
