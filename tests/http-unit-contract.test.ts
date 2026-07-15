import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createHttpAdapter } from '../src/adapters/http-adapter.js';
import type { AgentInput, ExecutionContext } from '../src/core/types.js';

const golden = JSON.parse(
  readFileSync(join(process.cwd(), 'tests/fixtures/http-unit/golden.json'), 'utf8'),
) as {
  request: { input: AgentInput };
  response: {
    content: string;
    toolCalls: unknown[];
    stopReason: string;
    metadata: Record<string, unknown>;
    tokenUsage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
      estimatedCost?: number;
    };
  };
};

describe('HttpAdapter golden fixture', () => {
  it('parses AgentOutput from remote unit response', async () => {
    const adapter = createHttpAdapter({
      endpoint: 'http://unit.test/execute',
      fetchFn: async (_url, init) => {
        const body = JSON.parse(String(init?.body)) as { input: AgentInput };
        expect(body.input.task).toBe(golden.request.input.task);
        return new Response(JSON.stringify(golden.response), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      },
    });

    const ctx = {
      workflowId: 'w',
      runId: 'r',
      unitId: 'u',
      traceId: 't',
      assembledContext: { messages: [], retrievedDocs: [], tokenCount: 0, truncated: false },
      secrets: {},
      abortSignal: new AbortController().signal,
    } satisfies ExecutionContext;

    const out = await adapter.execute(golden.request.input, ctx);
    expect(out.content).toBe('hello golden');
    expect(out.stopReason).toBe('stop');
    expect(out.toolCalls).toEqual([]);
    expect(out.tokenUsage?.totalTokens).toBe(3);
  });
});
