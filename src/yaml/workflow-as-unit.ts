import type { IncomingMessage, ServerResponse } from 'node:http';
import type { AgentInput, AgentOutput, WorkflowResult } from '../core/types.js';
import { createEngineFromYaml, type CreateEngineFromYamlOptions } from './loader.js';

export interface RunWorkflowAsUnitOptions extends CreateEngineFromYamlOptions {
  /** SharedState key for primary content (default: first `output.*` found, else `"done"`). */
  contentStateKey?: string;
  /** Override full AgentOutput mapping. */
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
 * Run a Workflow YAML as a single Unit execution: AgentInput → engine.run → AgentOutput.
 * Used by Workflow-as-Unit child services (TS↔TS composition).
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

export interface WorkflowAsUnitHttpHandlerOptions extends RunWorkflowAsUnitOptions {
  /** Path suffix that must match (default: ends with `/execute`). */
  pathEndsWith?: string;
}

/**
 * Node.js HTTP request listener for `POST .../execute` with Remote Unit JSON body `{ input }`.
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
