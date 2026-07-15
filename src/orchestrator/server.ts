import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { WorkflowRegistry } from './registry.js';
import type { ContextManager } from '../layer4/types.js';

export interface OrchestratorServerOptions {
  registry: WorkflowRegistry;
  contextManager?: ContextManager;
  host?: string;
  port?: number;
}

type JsonValue = unknown;

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function sendJson(res: ServerResponse, status: number, body: JsonValue): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

function matchPath(
  pattern: string,
  pathname: string,
): Record<string, string> | null {
  const pp = pattern.split('/').filter(Boolean);
  const lp = pathname.split('/').filter(Boolean);
  if (pp.length !== lp.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pp.length; i++) {
    const p = pp[i]!;
    const v = lp[i]!;
    if (p.startsWith(':')) {
      params[p.slice(1)] = decodeURIComponent(v);
    } else if (p !== v) {
      return null;
    }
  }
  return params;
}

/**
 * Lightweight HTTP orchestrator (Node built-in http — no Express/Fastify required).
 *
 * Routes:
 *   GET  /health
 *   GET  /workflows
 *   POST /workflows/from-yaml
 *   POST /workflows/:id/runs
 *   GET  /workflows/:id/runs/:runId
 *   POST /workflows/:id/runs/:runId/resume
 *   POST /workflows/:id/runs/:runId/hitl
 *   GET  /memory/search?q=...
 *   POST /mcp  (JSON-RPC MCP tools/call)
 */
export class OrchestratorServer {
  private server: Server | null = null;
  private readonly registry: WorkflowRegistry;
  private readonly contextManager?: ContextManager;
  private readonly host: string;
  private port: number;

  constructor(options: OrchestratorServerOptions) {
    this.registry = options.registry;
    this.contextManager = options.contextManager;
    this.host = options.host ?? '127.0.0.1';
    this.port = options.port ?? 8787;
  }

  async start(): Promise<{ host: string; port: number; url: string }> {
    if (this.server) {
      return { host: this.host, port: this.port, url: `http://${this.host}:${this.port}` };
    }

    this.server = createServer((req, res) => {
      void this.handle(req, res);
    });

    await new Promise<void>((resolve, reject) => {
      this.server!.once('error', reject);
      this.server!.listen(this.port, this.host, () => resolve());
    });

    const addr = this.server.address();
    if (addr && typeof addr !== 'string') {
      this.port = addr.port;
    }

    return { host: this.host, port: this.port, url: `http://${this.host}:${this.port}` };
  }

  async stop(): Promise<void> {
    if (!this.server) return;
    const server = this.server;
    this.server = null;
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }

  private async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const url = new URL(req.url ?? '/', `http://${this.host}:${this.port}`);
      const method = (req.method ?? 'GET').toUpperCase();
      const path = url.pathname;

      if (method === 'GET' && path === '/health') {
        return sendJson(res, 200, { ok: true, workflows: this.registry.listWorkflows() });
      }

      if (method === 'GET' && path === '/workflows') {
        return sendJson(res, 200, { workflows: this.registry.listWorkflows() });
      }

      if (method === 'POST' && path === '/workflows/from-yaml') {
        const body = await this.parseJson(req);
        const yaml = body.yaml;
        if (typeof yaml !== 'string' || !yaml.trim()) {
          return sendJson(res, 400, { error: 'body.yaml (string) is required' });
        }
        try {
          const { workflowId } = await this.registry.registerFromYaml(
            yaml,
            body.bindings as import('../yaml/bindings.js').UsesBindings | undefined,
          );
          return sendJson(res, 201, {
            workflowId,
            note: 'Registry is in-memory; re-register after Orchestrator restart.',
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          const name = err instanceof Error ? err.name : 'Error';
          const status =
            name === 'YamlValidationError' || name === 'YamlLoadError' ? 400 : 500;
          return sendJson(res, status, { error: message, type: name });
        }
      }

      let params = matchPath('/workflows/:id/runs', path);
      if (method === 'POST' && params) {
        const body = await this.parseJson(req);
        const sync = body.sync === true;
        const input = (body.input as Record<string, unknown> | undefined) ?? {};
        const record = sync
          ? await this.registry.startRunSync(params.id!, input)
          : await this.registry.startRun(params.id!, input);
        return sendJson(res, 202, record);
      }

      params = matchPath('/workflows/:id/runs/:runId', path);
      if (method === 'GET' && params) {
        const record = this.registry.getRun(params.runId!);
        if (!record) return sendJson(res, 404, { error: 'run not found' });
        return sendJson(res, 200, record);
      }

      params = matchPath('/workflows/:id/runs/:runId/resume', path);
      if (method === 'POST' && params) {
        const body = await this.parseJson(req);
        const record = await this.registry.resumeRun(
          params.runId!,
          body.snapshotId as string | undefined,
        );
        return sendJson(res, 200, record);
      }

      params = matchPath('/workflows/:id/runs/:runId/hitl', path);
      if (method === 'POST' && params) {
        const body = await this.parseJson(req);
        const approved = body.approved === true;
        const responder = (body.responder as string) ?? 'user';
        const record = await this.registry.respondHITL(params.runId!, approved, responder);
        return sendJson(res, 200, record);
      }

      if (method === 'GET' && path === '/memory/search') {
        if (!this.contextManager) {
          return sendJson(res, 501, { error: 'context manager not configured' });
        }
        const q = url.searchParams.get('q') ?? '';
        const topK = Number(url.searchParams.get('topK') ?? '5');
        const results = await this.contextManager.search(q, { topK });
        return sendJson(res, 200, { results });
      }

      if (method === 'POST' && path === '/mcp') {
        return this.handleMcp(req, res);
      }

      sendJson(res, 404, { error: 'not found', path });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      sendJson(res, 500, { error: message });
    }
  }

  private async handleMcp(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const body = await this.parseJson(req);
    const id = body.id ?? null;
    const method = body.method as string | undefined;

    if (method === 'initialize') {
      return sendJson(res, 200, {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'uni-flow-orchestrator', version: '0.1.0' },
        },
      });
    }

    if (method === 'tools/list') {
      return sendJson(res, 200, {
        jsonrpc: '2.0',
        id,
        result: {
          tools: [
            {
              name: 'run_workflow',
              description: 'Start a Uni-Flow workflow run',
              inputSchema: {
                type: 'object',
                properties: {
                  workflowId: { type: 'string' },
                  input: { type: 'object' },
                  sync: { type: 'boolean' },
                },
                required: ['workflowId'],
              },
            },
            {
              name: 'get_run',
              description: 'Get workflow run status',
              inputSchema: {
                type: 'object',
                properties: {
                  workflowId: { type: 'string' },
                  runId: { type: 'string' },
                },
                required: ['workflowId', 'runId'],
              },
            },
            {
              name: 'resume_run',
              description: 'Resume a paused workflow run',
              inputSchema: {
                type: 'object',
                properties: {
                  workflowId: { type: 'string' },
                  runId: { type: 'string' },
                  snapshotId: { type: 'string' },
                },
                required: ['workflowId', 'runId'],
              },
            },
            {
              name: 'respond_hitl',
              description: 'Approve or reject a HITL gate',
              inputSchema: {
                type: 'object',
                properties: {
                  workflowId: { type: 'string' },
                  runId: { type: 'string' },
                  approved: { type: 'boolean' },
                  responder: { type: 'string' },
                },
                required: ['workflowId', 'runId', 'approved'],
              },
            },
          ],
        },
      });
    }

    if (method === 'tools/call') {
      const params = (body.params as Record<string, unknown>) ?? {};
      const name = params.name as string;
      const args = (params.arguments as Record<string, unknown>) ?? {};

      let result: unknown;
      switch (name) {
        case 'run_workflow': {
          const sync = args.sync === true;
          result = sync
            ? await this.registry.startRunSync(
                args.workflowId as string,
                (args.input as Record<string, unknown>) ?? {},
              )
            : await this.registry.startRun(
                args.workflowId as string,
                (args.input as Record<string, unknown>) ?? {},
              );
          break;
        }
        case 'get_run':
          result = this.registry.getRun(args.runId as string) ?? { error: 'not found' };
          break;
        case 'resume_run':
          result = await this.registry.resumeRun(
            args.runId as string,
            args.snapshotId as string | undefined,
          );
          break;
        case 'respond_hitl':
          result = await this.registry.respondHITL(
            args.runId as string,
            args.approved === true,
            (args.responder as string) ?? 'mcp',
          );
          break;
        default:
          return sendJson(res, 200, {
            jsonrpc: '2.0',
            id,
            error: { code: -32601, message: `Unknown tool: ${name}` },
          });
      }

      return sendJson(res, 200, {
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        },
      });
    }

    sendJson(res, 200, {
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method not found: ${method}` },
    });
  }

  private async parseJson(req: IncomingMessage): Promise<Record<string, unknown>> {
    const raw = await readBody(req);
    if (!raw.trim()) return {};
    return JSON.parse(raw) as Record<string, unknown>;
  }
}

export function createOrchestratorServer(
  options: OrchestratorServerOptions,
): OrchestratorServer {
  return new OrchestratorServer(options);
}
